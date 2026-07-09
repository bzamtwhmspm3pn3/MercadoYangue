// server.js - API AgriMarket
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// ============ IMPORTAÇÃO DAS ROTAS EXISTENTES ============
const authroutes = require('./routes/auth');
const produtoroutes = require('./routes/produtos');
const chatroutes = require('./routes/chat');
const vendasroutes = require('./routes/vendas');
const comprasroutes = require('./routes/compras');
const checkoutroutes = require("./routes/checkout");
const carrinhoroutes = require('./routes/carrinho');
const faturaroutes = require("./routes/fatura");
const avaliacaoroutes = require("./routes/avaliacoes");
const vendedoresRoutes = require('./routes/vendedores');
const entregadoresRoutes = require('./routes/entregadores');
const entregasRoutes = require('./routes/entregas');
const usuariosroutes = require('./routes/usuarios');  // GENÉRICA - deve ser a última

// ============ ROTAS JIAM PREDITIVO ============
const modelosRoutes = require('./routes/modelos');
const modelosRRoutes = require("./routes/r-api/modelos");
const processamentoRoutes = require("./routes/r-api/processamento");
const visualizacaoRoutes = require("./routes/r-api/visualizacao");
const interpretacaoRoutes = require("./routes/r-api/interpretacao");
const dadosRoutes = require("./routes/r-api/dados");
const predicoesRoutes = require("./routes/predicoes");
const jiamAgroRoutes = require('./routes/jiamAgro');

// ============ ROTAS ADICIONAIS ============
const geolocalizacaoRoutes = require("./routes/geolocalizacao");

// ============ MIDDLEWARE ============
const app = express();
const port = process.env.PORT || 5000;

// Criar pasta temp caso não exista
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Configuração CORS
app.use(cors({
  origin: ['https://mercadoyangue.netlify.app', 'http://localhost:3000'],
  credentials: true
}));

// Segurança e compressão
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api", limiter);

// Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// ============ ROTAS MERCADO YANGUE (ORDEM CORRETA) ============
// ROTAS ESPECÍFICAS (primeiro)
app.use('/api/auth', authroutes);
app.use('/api/produtos', produtoroutes);
app.use('/api/entregadores', entregadoresRoutes);
app.use('/api/entregas', entregasRoutes);
app.use('/api/chat', chatroutes);
app.use('/api/vendas', vendasroutes);
app.use('/api/compras', comprasroutes);
app.use("/api/checkout", checkoutroutes);
app.use('/api/carrinho', carrinhoroutes);
app.use("/api/fatura", faturaroutes);
app.use("/api/avaliacoes", avaliacaoroutes);
app.use('/api/vendedores', vendedoresRoutes);

// ROTA GENÉRICA (por último)
app.use('/api', usuariosroutes);

// ============ ROTAS JIAM PREDITIVO ============
app.use("/api/modelos", modelosRoutes);
app.use("/api/r/processamento", processamentoRoutes);
app.use("/api/r/visualizacao", visualizacaoRoutes);
app.use("/api/r/interpretacao", interpretacaoRoutes);
app.use("/api/r/modelos", modelosRRoutes);
app.use("/api/r/dados", dadosRoutes);
app.use("/api/predicoes", predicoesRoutes);
app.use('/api/jiam', jiamAgroRoutes);

app.use("/api/geolocalizacao", geolocalizacaoRoutes);

// ============ ROTA HEALTH ============
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Mercado Yangue + JIAM Preditivo Online",
    timestamp: new Date().toISOString(),
    modules: {
      mercado: true,
      jiam_preditivo: true,
      geolocalizacao: true
    }
  });
});

// ============ SOCKET.IO CONFIGURATION ============
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["https://mercadoyangue.netlify.app", "http://localhost:3000"], methods: ["GET", "POST"] }
});

app.set("io", io);

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);

  const userId = socket.handshake.query.userid;
  if (userId) {
    onlineUsers[userId] = socket.id;
    socket.join(userId);
    console.log(`Usuário ${userId} entrou na sala pessoal.`);
  }

  socket.on("sendMessage", async ({ senderId, receiverId, conteudo, arquivo, arquivoNome, arquivoTipo }) => {
    try {
      const mensagemModel = require('./models/mensagem');
      if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) return;

      const novaMsg = await mensagemModel.create({
        remetente: senderId,
        destinatario: receiverId,
        conteudo,
        arquivo,
        arquivoNome,
        arquivoTipo
      });

      const msgPopulada = await mensagemModel.findById(novaMsg._id)
        .populate("remetente", "nome email")
        .populate("destinatario", "nome email");

      io.to(receiverId.toString()).emit("receiveMessage", msgPopulada);
      io.to(senderId.toString()).emit("receiveMessage", msgPopulada);
    } catch (err) {
      console.error("❌ Erro ao enviar mensagem via socket:", err);
    }
  });

  socket.on("disconnect", () => {
    for (let uid in onlineUsers) {
      if (onlineUsers[uid] === socket.id) {
        delete onlineUsers[uid];
        console.log(`🔴 Usuário ${uid} desconectado.`);
      }
    }
  });
});



// ============ ROTA DO CHATBOT ============
let memoriaConversas = {};

app.post("/api/chatbot", async (req, res) => {
  try {
    const { mensagem, sessionId } = req.body;
    if (!mensagem) return res.status(400).json({ resposta: "Mensagem vazia recebida." });

    const id = sessionId || "default";
    if (!memoriaConversas[id]) memoriaConversas[id] = [];

    memoriaConversas[id].push({ remetente: "user", texto: mensagem });

    const msg = mensagem.toLowerCase();
    let resposta = "Desculpa, ainda estou a aprender sobre isso.";

    if (/(olá|ola|oi|bom dia|boa tarde|boa noite)/.test(msg)) {
      resposta = "Ola! Seja bem-vindo ao Mercado Yangue — a plataforma angolana de comercio agricola. Em que posso ajudar?";
    } else if (/(obrigad[ao]|valeu|grato)/.test(msg)) {
      resposta = "De nada! Estamos aqui para ajudar no seu negocio agricola.";
    } else if (/(tchau|adeus|até logo)/.test(msg)) {
      resposta = "Ate logo! Volte sempre ao Mercado Yangue.";
    } else if (msg.includes("vender")) {
      resposta = "Para vender, va a aba 'Cadastrar Produtos', adicione fotos, descricao e preco. Simples e rapido!";
    } else if (msg.includes("comprar")) {
      resposta = "Para comprar, entre no produto desejado e clique em 'Adicionar ao Carrinho'. Depois escolha o metodo de pagamento.";
    } else if (msg.includes("entrega") || msg.includes("logistica")) {
      resposta = "As entregas sao combinadas entre vendedor e comprador. Consulte a aba 'Entregas' para prazos por provincia.";
    } else if (msg.includes("jiam") || msg.includes("previsao") || msg.includes("analise")) {
      resposta = "O JIAM Preditivo e o nosso sistema de inteligencia de dados! Acesse o Dashboard de Previsoes para analises de mercado, precos e producao.";
    } else if (msg.includes("pagamento") || msg.includes("iban")) {
      resposta = "Aceitamos Transferencia Bancaria (IBAN), Multicaixa Express e Dinheiro na Entrega.";
    } else if (msg.includes("rastrear") || msg.includes("geolocalizacao")) {
      resposta = "Produtores podem rastrear suas plantacoes. Compradores veem a origem exata dos produtos!";
    }

    memoriaConversas[id].push({ remetente: "bot", texto: resposta });
    res.json({ resposta });
  } catch (erro) {
    console.error("Erro na rota /api/chatbot:", erro);
    res.status(500).json({ resposta: "Erro interno no servidor." });
  }
});

// ============ CONEXÃO MONGODB ============
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ ERRO: MONGO_URI não está definido!");
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB conectado ao Atlas');
  server.listen(port, () => {
    console.log(`\n🚀 SERVIDOR INICIADO NA PORTA ${port}`);
    console.log(`📍 API: http://localhost:${port}/api`);
    console.log(`📊 JIAM Preditivo: http://localhost:${port}/api/jiam`);
    console.log(`💬 Chatbot: http://localhost:${port}/api/chatbot`);
    console.log("=".repeat(50));
  });
})
.catch(err => {
  console.error('❌ Erro ao conectar MongoDB Atlas:', err.message);
  process.exit(1);
});