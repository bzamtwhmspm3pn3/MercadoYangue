const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // usamos mongoose ao invés de MongoClient
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Middleware CORS personalizado
const allowedOrigins = [
  'http://localhost:3000',
  'https://super-souffle-c9b0fb.netlify.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // permitir Postman ou cURL
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'O CORS não permite essa origem!';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Rotas
app.use('/api', authRoutes);
app.use('/api', usuarioRoutes);

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mercadoyangue', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Conectado ao MongoDB');

  // Iniciar servidor
  app.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}`);
  });
})
.catch((err) => {
  console.error('Erro ao conectar ao MongoDB:', err);
});
