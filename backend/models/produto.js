const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String },
  preco: { type: Number, required: true },
  quantidade: { type: Number, required: true, min: 0, default: 0 },
  unidade: { type: String, default: "un" },
  imagem: { type: String },
  provincia: { type: String },
  municipio: { type: String },
  localizacaoEspecifica: { type: String },

  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  contactos: { type: String },          // salva contatos do vendedor
  formaPagamento: {
    tipo: { type: String, required: true },
    iban: String,
    numConta: String,
    banco: String,
    opcao: String,
    telefone: String,
  },

  vezesAdicionadoCarrinho: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Previne erro ao registrar modelo mais de uma vez
module.exports = mongoose.models.Produto || mongoose.model('Produto', ProdutoSchema);
