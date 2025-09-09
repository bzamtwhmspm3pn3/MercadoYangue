
const mongoose = require('mongoose');

const mensagemSchema = new mongoose.Schema({
  remetenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  destinatarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  mensagem: { type: String, required: true },
  data: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mensagem', mensagemSchema);
