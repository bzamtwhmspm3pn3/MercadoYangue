const mongoose = require('mongoose');

const EntregaSchema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  entregadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto' },
  vendaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venda' },
  origem: { type: String, required: true },
  destino: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pendente', 'aceita', 'retirada', 'entregue', 'cancelada'], 
    default: 'pendente' 
  },
  observacoes: { type: String },
  valorFrete: { type: Number, default: 0 },
  localizacoes: [{
    lat: Number,
    lng: Number,
    timestamp: { type: Date, default: Date.now },
    status: String
  }],
  dataEntrega: { type: Date },
}, { timestamps: true });

module.exports = mongoose.models.Entrega || mongoose.model('Entrega', EntregaSchema);