const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const authroutes = require('./routes/auth');
const usuarioroutes = require('./routes/usuarios');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());

// Configuração de CORS permitindo apenas o frontend no Netlify
app.use(cors({
  origin: 'https://mercadoyangue.netlify.app', // frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Conectar ao MongoDB Atlas
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mercadoyangue', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado ao MongoDB Atlas');

  // rotas
  app.use('/api', authroutes);
  app.use('/api', usuarioroutes);

  // iniciar servidor
  app.listen(port, () => {
    console.log(`🚀 Backend rodando em http://localhost:${port}`);
  });
})
.catch((err) => {
  console.error('❌ Erro ao conectar ao MongoDB:', err);
});
