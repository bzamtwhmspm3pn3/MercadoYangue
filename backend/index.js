const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // usamos mongoose ao invés de MongoClient
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Conectar ao MongoDB com mongoose
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mercadoyangue', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Conectado ao MongoDB');

  // Rotas
  app.use('/api', authRoutes);
  app.use('/api', usuarioRoutes);

  // Iniciar servidor
  app.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}`);
  });
})
.catch((err) => {
  console.error('Erro ao conectar ao MongoDB:', err);
});
