const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // usamos mongoose ao invés de mongoclient
const dotenv = require('dotenv');

const authroutes = require('./routes/auth');
const usuarioroutes = require('./routes/usuarios');

dotenv.config();

const app = express();
const port = process.env.port || 3000;

// middleware
app.use(express.json());
app.use(cors());

// conectar ao mongodb com mongoose
mongoose.connect(process.env.mongo_uri || 'mongodb://localhost:27017/mercadoyangue', {
  usenewurlparser: true,
  useunifiedtopology: true,
})
.then(() => {
  console.log('conectado ao mongodb');

  // rotas
  app.use('/api', authroutes);
  app.use('/api', usuarioroutes);

  // iniciar servidor
  app.listen(port, () => {
    console.log(`backend rodando em http://localhost:${port}`);
  });
})
.catch((err) => {
  console.error('erro ao conectar ao mongodb:', err);
});
