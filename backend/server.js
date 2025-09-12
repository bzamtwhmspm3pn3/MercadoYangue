require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Rotas
const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/auth');
const produtoRoutes = require('./routes/produtos');
const chatRoutes = require('./routes/chat');
const vendasRoutes = require('./routes/vendas');
const comprasRoutes = require('./routes/compras');
const checkoutRoutes = require("./routes/checkout");

// Models
const Mensagem = require('./models/mensagem'); // para salvar histórico

// 🔹 Middleware: permitir CORS e leitura de JSON
const allowedOrigins = [
  'http://localhost:3000',                             // Dev local
  'https://super-souffle-c9b0fb.netlify.app'          // Netlify (corrigido)
];

app.use(cors({
  origin: function (origin, callback) {
    // requests sem origin (Postman, server-side) são aceitos
    if (!origin) return callback(null, true);

    if (!allowedOrigins.includes(origin)) {
      const msg = `❌ O CORS não permite esta origem: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());


// ✅ Servir arquivos estáticos de imagens
app.use('/uploads', express.static('uploads'));

// ✅ Rotas REST
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api', usuariosRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/compras', comprasRoutes);
app.use("/api/checkout", checkoutRoutes);

// ✅ Configuração Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // frontend
    methods: ["GET", "POST"]
  }
});

// Guardar usuários online
let onlineUsers = {};

// Quando alguém conecta
io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers[userId] = socket.id;
    console.log("Usuário logado:", userId);
  }

  // Receber mensagem
  socket.on("sendMessage", async ({ senderId, receiverId, conteudo }) => {
    console.log(`Mensagem de ${senderId} para ${receiverId}: ${conteudo}`);

    // 1. Salvar no banco
    try {
      const novaMsg = new Mensagem({
        remetente: senderId,
        destinatario: receiverId,
        conteudo
      });
      await novaMsg.save();
      console.log("Mensagem salva no MongoDB");
    } catch (err) {
      console.error("Erro ao salvar mensagem:", err);
    }

    // 2. Enviar em tempo real se o destinatário estiver online
    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", { senderId, conteudo });
    }
  });

  // Quando desconecta
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
    for (let uid in onlineUsers) {
      if (onlineUsers[uid] === socket.id) {
        delete onlineUsers[uid];
      }
    }
  });
});

// 🔹 Conexão ao MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;

console.log("🔑 MONGO_URI:", MONGO_URI ? "Carregado ✅" : "Não definido ❌");

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log(`✅ MongoDB conectado ao banco: ${mongoose.connection.name}`);
  app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
})
.catch(err => {
  console.error('❌ Erro ao conectar no MongoDB:', err.message);
});
