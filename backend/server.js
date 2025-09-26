require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Rotas
const usuariosroutes = require('./routes/usuarios');
const authroutes = require('./routes/auth');
const produtoroutes = require('./routes/produtos');
const chatroutes = require('./routes/chat');
const vendasroutes = require('./routes/vendas');
const comprasroutes = require('./routes/compras');
const checkoutroutes = require("./routes/checkout");
const carrinhoroutes = require('./routes/carrinho');
const faturaroutes = require("./routes/fatura");

// Models
const mensagem = require('./models/mensagem');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://mercadoyangue.netlify.app', // frontend
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// Rotas REST
app.use('/api/auth', authroutes);
app.use('/api/produtos', produtoroutes);
app.use('/api', usuariosroutes);
app.use('/api/chat', chatroutes);
app.use('/api/vendas', vendasroutes);
app.use('/api/compras', comprasroutes);
app.use("/api/checkout", checkoutroutes);
app.use('/api/carrinho', carrinhoroutes);
app.use("/api/fatura", faturaroutes);

// Cria server HTTP + socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "https://mercadoyangue.netlify.app", methods: ["GET","POST"] }
});

// Socket.io
let onlineusers = {};

io.on("connection", (socket) => {
  console.log("cliente conectado:", socket.id);
  const userid = socket.handshake.query.userid;
  if (userid) onlineusers[userid] = socket.id;

  socket.on("sendmessage", async ({ senderid, receiverid, conteudo, arquivo, arquivonome, arquivotipo }) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(senderid) || !mongoose.Types.ObjectId.isValid(receiverid)) return;
      const novamsg = await mensagem.create({ remetente: senderid, destinatario: receiverid, conteudo, arquivo, arquivonome, arquivotipo });
      const msgpopulada = await mensagem.findById(novamsg._id)
        .populate("remetente", "nome email")
        .populate("destinatario", "nome email");
      io.to(receiverid).emit("receivemessage", msgpopulada);
      io.to(senderid).emit("receivemessage", msgpopulada);
    } catch (err) {
      console.error("erro socket:", err);
    }
  });

  socket.on("disconnect", () => {
    for (let uid in onlineusers) {
      if (onlineusers[uid] === socket.id) delete onlineusers[uid];
    }
  });
});

// === Conectar ao MongoDB Atlas ===
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ ERRO: MONGO_URI não está definido nas variáveis de ambiente!");
  process.exit(1); // força parar para não tentar localhost em produção
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

