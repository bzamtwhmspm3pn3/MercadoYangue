require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/auth');
const produtoRoutes = require('./routes/produtos');
const chatRoutes = require('./routes/chat');
const vendasRoutes = require('./routes/vendas');
const comprasRoutes = require('./routes/compras');

const app = express();

// 🔹 Middleware: permitir CORS e leitura de JSON
const allowedOrigins = [
  'http://localhost:3000',              // Desenvolvimento local
  process.env.FRONTEND_URL || ''        // Produção (Netlify)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman, server-side

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = '❌ O CORS não permite esta origem.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// 🔹 Servir arquivos estáticos de imagens
app.use('/uploads', express.static('uploads'));

// 🔹 Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/compras', comprasRoutes);

// ⚠️ REMOVIDO bloco que tentava servir o frontend

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
