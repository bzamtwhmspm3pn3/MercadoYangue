// server.js - BACKEND COMPLETO (MERCADO YANGUE + JIAM PREDITIVO)
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
const usuariosroutes = require('./routes/usuarios');
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

// ============ IMPORTAÇÃO DAS ROTAS JIAM ============
const modelosRoutes = require('./routes/modelos');
const modelosRRoutes = require("./routes/r-api/modelos");
const processamentoRoutes = require("./routes/r-api/processamento");
const visualizacaoRoutes = require("./routes/r-api/visualizacao");
const interpretacaoRoutes = require("./routes/r-api/interpretacao");
const dadosRoutes = require("./routes/r-api/dados");
const predicoesRoutes = require("./routes/predicoes");
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

// ============ ROTAS MERCADO YANGUE ============
app.use('/api/auth', authroutes);
app.use('/api/produtos', produtoroutes);
app.use('/api', usuariosroutes);
app.use('/api/chat', chatroutes);
app.use('/api/vendas', vendasroutes);
app.use('/api/compras', comprasroutes);
app.use("/api/checkout", checkoutroutes);
app.use('/api/carrinho', carrinhoroutes);
app.use("/api/fatura", faturaroutes);
app.use("/api/avaliacoes", avaliacaoroutes);
app.use('/api/vendedores', vendedoresRoutes);

// ============ ROTAS JIAM PREDITIVO ============
app.use("/api/modelos", modelosRoutes);
app.use("/api/r/processamento", processamentoRoutes);
app.use("/api/r/visualizacao", visualizacaoRoutes);
app.use("/api/r/interpretacao", interpretacaoRoutes);
app.use("/api/r/modelos", modelosRRoutes);
app.use("/api/r/dados", dadosRoutes);
app.use("/api/predicoes", predicoesRoutes);
app.use("/api/geolocalizacao", geolocalizacaoRoutes);

// ============ ROTA HEALTH ============
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Mercado Yangue + JIAM Preditivo Online",
    timestamp: new Date().toISOString(),
    modules: {
      mercado_yangue: true,
      jiam_preditivo: true,
      r_js: true,
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

// ============ ROTA DO CHATBOT (IA YANGUE) ============
let memoriaConversas = {};

function obterContexto(sessionId) {
  const conversa = memoriaConversas[sessionId] || [];
  return conversa.filter((m) => m.remetente === "user").slice(-3).map((m) => m.texto).join(" | ");
}

app.post("/api/chatbot", async (req, res) => {
  try {
    const { mensagem, sessionId } = req.body;
    if (!mensagem) return res.status(400).json({ resposta: "Mensagem vazia recebida. 🤔" });

    const id = sessionId || "default";
    if (!memoriaConversas[id]) memoriaConversas[id] = [];

    memoriaConversas[id].push({ remetente: "user", texto: mensagem });

    const msg = mensagem.toLowerCase();
    const contexto = obterContexto(id);
    let resposta = "Desculpa, ainda estou a aprender sobre isso. 😅";

    // Saudações
    if (/(olá|ola|oi|bom dia|boa tarde|boa noite)/.test(msg)) {
      resposta = "Olá! 👋 Seja bem-vindo ao MercadoYangue — a tua plataforma angolana de comércio digital. Em que posso ajudar hoje?";
    } else if (/(obrigad[ao]|valeu|grato)/.test(msg)) {
      resposta = "De nada! 😊 É sempre um prazer ajudar-te no MercadoYangue.";
    } else if (/(tchau|adeus|até logo)/.test(msg)) {
      resposta = "Até já! 👋 Volta sempre ao MercadoYangue — estamos sempre por cá!";
    }
    // Conhecimento geral
    else if (msg.includes("mercado yangue") || msg.includes("sobre")) {
      resposta = "O MercadoYangue é uma plataforma digital angolana criada por Venâncio Elavoco Cassova Martins. A sua missão é conectar clientes e vendedores locais, promovendo o comércio nacional e a sustentabilidade económica. 🌍";
    } else if (msg.includes("missão")) {
      resposta = "A missão do MercadoYangue é unir os angolanos através de uma plataforma que valoriza produtos locais e fortalece a economia nacional. 🤝";
    } else if (msg.includes("contrato") || msg.includes("comissão")) {
      resposta = "O vendedor/agricultor aceita o Contrato Digital, comprometendo-se com a veracidade das informações, prazos de entrega e pagamento de 0,5% de comissão sobre cada venda à plataforma. 💼";
    } else if (msg.includes("vender")) {
      resposta = "Para vender, vai à aba 'Cadastrar Produtos', adiciona fotos, descrição e preço. É simples e rápido! 📸";
    } else if (msg.includes("comprar")) {
      resposta = "Para comprar, entra no produto desejado e clica em 'Adicionar ao Carrinho'. Depois escolhe o método de pagamento que preferires. 🛒";
    } else if (msg.includes("entrega") || msg.includes("logística")) {
      resposta = "As entregas são combinadas entre vendedor e comprador. Consulte a aba 'Entregas' para prazos por província. 🚚";
    } else if (msg.includes("previsão") || msg.includes("predição") || msg.includes("jiam")) {
      resposta = "O JIAM Preditivo é nosso sistema de inteligência de dados! Acesse o Dashboard de Previsões para ver análises de demanda, preços e produção. 📊";
    } else if (msg.includes("geolocalização") || msg.includes("rastrear")) {
      resposta = "Produtores podem rastrear suas plantações por geolocalização. Compradores veem a origem exata dos produtos! 🗺️";
    }

    memoriaConversas[id].push({ remetente: "bot", texto: resposta });
    res.json({ resposta });
  } catch (erro) {
    console.error("❌ Erro na rota /api/chatbot:", erro);
    res.status(500).json({ resposta: "Erro interno no servidor. 😕" });
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
    console.log(`\n🚀 SERVIDOR COMPLETO INICIADO NA PORTA ${port}`);
    console.log(`📍 Mercado Yangue API: http://localhost:${port}/api`);
    console.log(`📊 JIAM Preditivo API: http://localhost:${port}/api/predicoes`);
    console.log(`🗺️ Geolocalização API: http://localhost:${port}/api/geolocalizacao`);
    console.log(`🤖 Chatbot IA: http://localhost:${port}/api/chatbot`);
    console.log("=".repeat(50));
  });
})
.catch(err => {
  console.error('❌ Erro ao conectar MongoDB Atlas:', err.message);
  process.exit(1);
});