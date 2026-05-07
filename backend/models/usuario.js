const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  senha: { type: String, required: true },
  tipo: { 
    type: String, 
    enum: ['cliente', 'vendedor', 'agricultor', 'entregador'], 
    required: true 
  },
  senhaResetToken: { type: String },
  senhaResetExp: { type: Date },

  // Para vendedores/agricultores
  provincia: { type: String },
  municipio: { type: String },
  localizacaoEspecifica: { type: String },

  // Para entregadores
  telefone: { type: String },
  veiculo: { type: String },
  placa: { type: String },
  localizacaoAtual: {
    lat: { type: Number },
    lng: { type: Number },
    ultimaAtualizacao: { type: Date, default: Date.now }
  },
  disponivel: { type: Boolean, default: true },

  aceitouContrato: { type: Boolean, default: false },
  aceitouTermos: { type: Boolean, default: false },

}, {
  timestamps: true,
});

module.exports = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);