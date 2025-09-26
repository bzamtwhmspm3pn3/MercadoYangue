require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { server } = require('socket.io');

// rotas
const usuariosroutes = require('./routes/usuarios');
const authroutes = require('./routes/auth');
const produtoroutes = require('./routes/produtos');
const chatroutes = require('./routes/chat');
const vendasroutes = require('./routes/vendas');
const comprasroutes = require('./routes/compras');
const checkoutroutes = require("./routes/checkout");
const carrinhoroutes = require('./routes/carrinho');
const faturaroutes = require("./routes/fatura");

// models
const mensagem = require('./models/mensagem');
const usuario = require('./models/usuario');

const app = express();

// middleware
app.use(cors({
  origin: 'https://mercadoyangue-i3in.onrender.com',
  credentials: true
}));


// aumentando limite para 50mb
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static('uploads'));

// rotas rest
app.use('/api/auth', authroutes);
app.use('/api/produtos', produtoroutes);
app.use('/api', usuariosroutes);
app.use('/api/chat', chatroutes);
app.use('/api/vendas', vendasroutes);
app.use('/api/compras', comprasroutes);
app.use("/api/checkout", checkoutroutes);
app.use('/api/carrinho', carrinhoroutes);
app.use("/api/fatura", faturaroutes);

// configuração socket.io
const server = http.createserver(app);
const io = new server(server, {
  cors: { origin: "https://mercadoyangue-i3in.onrender.com", methods: ["get","post"] }
});

// guardar usuários online
let onlineusers = {};

// conexão socket
io.on("connection", (socket) => {
  console.log("cliente conectado:", socket.id);

  const userid = socket.handshake.query.userid;
  if (userid) {
    onlineusers[userid] = socket.id;
    socket.join(userid);
  }

  socket.on("sendmessage", async ({ senderid, receiverid, conteudo, arquivo, arquivonome, arquivotipo }) => {
    try {
      if (!mongoose.types.objectid.isvalid(senderid) || !mongoose.types.objectid.isvalid(receiverid)) {
        console.error("ids inválidos:", senderid, receiverid);
        return;
      }

      const novamsg = await mensagem.create({
        remetente: senderid,
        destinatario: receiverid,
        conteudo,
        arquivo,
        arquivonome,
        arquivotipo
      });

      const msgpopulada = await mensagem.findbyid(novamsg._id)
        .populate("remetente", "nome email")
        .populate("destinatario", "nome email");

      io.to(receiverid).emit("receivemessage", msgpopulada);
      io.to(senderid).emit("receivemessage", msgpopulada);
    } catch (err) {
      console.error("erro ao enviar mensagem socket:", err);
    }
  });

  socket.on("disconnect", () => {
    for (let uid in onlineusers) {
      if (onlineusers[uid] === socket.id) delete onlineusers[uid];
    }
  });
});


// conexão mongodb
const port = process.env.port || 5000;
const mongo_uri = process.env.mongo_uri;

mongoose.connect(mongo_uri, { usenewurlparser: true, useunifiedtopology: true })
  .then(() => {
    console.log('mongodb conectado no banco:', mongoose.connection.name);
    server.listen(port, () => console.log(`servidor rodando na porta ${port}`));
  })
  .catch(err => console.error('erro ao conectar no mongodb:', err));
