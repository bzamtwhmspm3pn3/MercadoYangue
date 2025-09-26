const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  senha: { type: String, required: true }, // armazene hash depois
  tipo: { type: String, enum: ['cliente', 'vendedor', 'agricultor'], required: true },

  // Apenas para vendedores/agricultores
  provincia: { type: String },
  municipio: { type: String },
  localizacaoEspecifica: { type: String },

  aceitouContrato: { type: Boolean, default: false },  // Novo campo para aceitar contrato

}, {
  timestamps: true,
});

module.exports = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
