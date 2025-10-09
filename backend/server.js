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
