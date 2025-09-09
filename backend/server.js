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

// ✅ Middleware: permitir CORS e leitura de JSON
app.use(cors({
  origin: 'http://localhost:3000', // Altere para o domínio real em produção
  credentials: true
}));
app.use(express.json());

// ✅ Servir arquivos estáticos de imagens
app.use('/uploads', express.static('uploads'));

// ✅ Rotas
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api', usuariosRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/compras', comprasRoutes);


// ✅ Conexão ao MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB conectado no banco:', mongoose.connection.name);
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch(err => {
    console.error('Erro ao conectar no MongoDB:', err);
  });
