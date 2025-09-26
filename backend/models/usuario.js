const mongoose = require('mongoose');

const usuarioschema = new mongoose.schema({
  nome: { type: string, required: true },
  email: { type: string, required: true, unique: true, lowercase: true, trim: true },
  senha: { type: string, required: true }, // armazene hash depois
  tipo: { type: string, enum: ['cliente', 'vendedor', 'agricultor'], required: true },

  // apenas para vendedores/agricultores
  provincia: { type: string },
  municipio: { type: string },
  localizacaoespecifica: { type: string },

  aceitoucontrato: { type: boolean, default: false },  // novo campo para aceitar contrato

}, {
  timestamps: true,
});

module.exports = mongoose.models.usuario || mongoose.model('usuario', usuarioschema);
