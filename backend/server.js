require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const fs = require('fs');
const path = require('path');

// Criar pasta temp caso não exista
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
  console.log('✅ Pasta temp/ criada automaticamente.');
}


// === Rotas ===
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


// === Models ===
const mensagem = require('./models/mensagem');

const app = express();
const port = process.env.PORT || 5000;

// === Middleware ===
app.use(cors({
  origin: 'https://mercadoyangue.netlify.app', // teu frontend
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// === Rotas REST ===
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


// === Criação do servidor HTTP + Socket.IO ===
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "https://mercadoyangue.netlify.app", methods: ["GET", "POST"] }
});

// 🔥 Permitir que o io seja usado dentro das rotas Express
app.set("io", io);

// === Gestão de usuários online ===
let onlineUsers = {};

// === Eventos Socket.IO ===
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);

  // Registrar o ID do usuário e criar uma "sala" exclusiva para ele
  const userId = socket.handshake.query.userid;
  if (userId) {
    onlineUsers[userId] = socket.id;
    socket.join(userId); // 🔥 entra na sala do próprio usuário
    console.log(`Usuário ${userId} entrou na sala pessoal.`);
  }

  // Quando uma mensagem é enviada
  socket.on("sendMessage", async ({ senderId, receiverId, conteudo, arquivo, arquivoNome, arquivoTipo }) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) return;

      // Criar a nova mensagem
      const novaMsg = await mensagem.create({
        remetente: senderId,
        destinatario: receiverId,
        conteudo,
        arquivo,
        arquivoNome,
        arquivoTipo
      });

      // Buscar mensagem populada (com remetente e destinatário)
      const msgPopulada = await mensagem.findById(novaMsg._id)
        .populate("remetente", "nome email")
        .populate("destinatario", "nome email");

      // 🔥 Emitir em tempo real para remetente e destinatário
      io.to(receiverId.toString()).emit("receiveMessage", msgPopulada);
      io.to(senderId.toString()).emit("receiveMessage", msgPopulada);
    } catch (err) {
      console.error("❌ Erro ao enviar mensagem via socket:", err);
    }
  });

  // Quando o cliente desconecta
  socket.on("disconnect", () => {
    for (let uid in onlineUsers) {
      if (onlineUsers[uid] === socket.id) {
        delete onlineUsers[uid];
        console.log(`🔴 Usuário ${uid} desconectado.`);
      }
    }
  });
});

// === Conexão ao MongoDB Atlas ===
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ ERRO: MONGO_URI não está definido nas variáveis de ambiente!");
  process.exit(1);
}


// 🔹 Rota da IA Yangue – com memória, contexto e saudações
let memoriaConversas = {}; // Memória temporária por sessão

function obterContexto(sessionId) {
  const conversa = memoriaConversas[sessionId] || [];
  return conversa
    .filter((m) => m.remetente === "user")
    .slice(-3)
    .map((m) => m.texto)
    .join(" | ");
}

app.post("/api/chatbot", async (req, res) => {
  try {
    const { mensagem, sessionId } = req.body;
    if (!mensagem) {
      return res.status(400).json({ resposta: "Mensagem vazia recebida. 🤔" });
    }

    const id = sessionId || "default";
    if (!memoriaConversas[id]) memoriaConversas[id] = [];

    memoriaConversas[id].push({ remetente: "user", texto: mensagem });

    const msg = mensagem.toLowerCase();
    const contexto = obterContexto(id);
    let resposta = "Desculpa, ainda estou a aprender sobre isso. 😅";

    // 🟢 Saudações e expressões sociais
    if (/(olá|ola|oi|bom dia|boa tarde|boa noite)/.test(msg)) {
      resposta =
        "Olá! 👋 Seja bem-vindo ao MercadoYangue — a tua plataforma angolana de comércio digital. Em que posso ajudar hoje?";
    } else if (/(obrigad[ao]|valeu|grato|agradecid[ao])/.test(msg)) {
      resposta = "De nada! 😊 É sempre um prazer ajudar-te no MercadoYangue.";
    } else if (/(tchau|adeus|até logo|até breve)/.test(msg)) {
      resposta =
        "Até já! 👋 Volta sempre ao MercadoYangue — estamos sempre por cá!";
    }

    // 🟣 Conhecimento geral
    else if (msg.includes("mercado yangue") || msg.includes("sobre")) {
      resposta =
        "O MercadoYangue é uma plataforma digital angolana criada por Venâncio Elavoco Cassova Martins. A sua missão é conectar clientes e vendedores locais, promovendo o comércio nacional e a sustentabilidade económica. 🌍";
    } else if (msg.includes("missão")) {
      resposta =
        "A missão do MercadoYangue é unir os angolanos através de uma plataforma que valoriza produtos locais e fortalece a economia nacional. 🤝";
    } else if (msg.includes("visão")) {
      resposta =
        "A visão é ser o maior e mais confiável mercado digital de Angola, impulsionando o empreendedorismo e a inclusão financeira. 🚀";
    } else if (msg.includes("valores")) {
      resposta =
        "Os valores do MercadoYangue são: Verdade, Transparência, Pontualidade, Responsabilidade, Sustentabilidade, Justiça e Inovação. ⚖️";
    } else if (msg.includes("contrato") || msg.includes("comissão")) {
      resposta =
        "O vendedor/agricultor aceita o Contrato Digital, comprometendo-se com a veracidade das informações, prazos de entrega e pagamento de 0,5% de comissão sobre cada venda à plataforma. 💼";
    }

    // 🟠 Funcionalidades práticas
    else if (msg.includes("vender")) {
      resposta =
        "Para vender, vai à aba 'Cadastrar Produtos', adiciona fotos, descrição e preço. É simples e rápido! 📸";
    } else if (msg.includes("comprar")) {
      resposta =
        "Para comprar, entra no produto desejado e clica em 'Adicionar ao Carrinho'. Depois escolhe o método de pagamento que preferires. 🛒";
    } else if (msg.includes("entrega")) {
      resposta =
        "As entregas demoram entre 24h e 72h, dependendo da província e da disponibilidade do vendedor. 🚚";
    } else if (msg.includes("suporte")) {
      resposta =
        "Podes contactar o suporte pelo WhatsApp +244 920 000 000 ou email suporte@mercadoyangue.co.ao 💬";
    } else if (msg.includes("conta") || msg.includes("login")) {
      resposta =
        "Cria a tua conta clicando em 'Iniciar Sessão' > 'Cadastro'. É rápido, gratuito e dá-te acesso completo à plataforma. 🔐";
    } else if (
      msg.includes("pagamento") ||
      msg.includes("iban") ||
      msg.includes("multicaixa")
    ) {
      resposta =
        "Os pagamentos são feitos directamente entre comprador e vendedor via IBAN, conta bancária, dinheiro na entrega ou Multicaixa Express. 💳";
    } else if (msg.includes("futuro") || msg.includes("expansão")) {
      resposta =
        "O MercadoYangue planeia integrar pagamentos móveis, lançar apps móveis e expandir-se para zonas rurais com suporte a línguas nacionais. 🌍";
    } else if (msg.includes("quem criou")) {
      resposta =
        "O MercadoYangue foi idealizado por Venâncio Elavoco Cassova Martins, com foco em inovação tecnológica e sustentabilidade em Angola. 💡";
    }

    // 🔸 Respostas com contexto
    else if (msg.includes("e o preço") || msg.includes("quanto custa")) {
      if (contexto.includes("comprar") || contexto.includes("produto")) {
        resposta =
          "Os preços variam conforme o vendedor. Entra no produto desejado e verás o valor exacto e métodos de pagamento. 💰";
      } else {
        resposta =
          "Podes indicar de qual produto estás a falar? Assim posso responder melhor. 🤔";
      }
    }

    memoriaConversas[id].push({ remetente: "bot", texto: resposta });

    res.json({ resposta });
  } catch (erro) {
    console.error("❌ Erro na rota /api/chatbot:", erro);
    res.status(500).json({ resposta: "Erro interno no servidor. 😕" });
  }
});


mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ MongoDB conectado ao Atlas');
    server.listen(port, () => console.log(`🚀 Backend rodando na porta ${port}`));
  })
  .catch(err => {
    console.error('❌ Erro ao conectar MongoDB Atlas:', err.message);
    process.exit(1);
  });
