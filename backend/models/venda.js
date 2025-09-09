const mongoose = require('mongoose');

const vendaSchema = new mongoose.Schema({
  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  itens: [
    {
      produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
      quantidade: { type: Number, required: true },
      precoUnitario: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  status: { type: String, enum: ['pendente', 'concluída'], default: 'pendente' },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Venda', vendaSchema);