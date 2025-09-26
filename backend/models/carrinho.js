 const mongoose = require("mongoose");

const CarrinhoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  itens: [
    {
      produto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Produto",
        required: true,
      },
      quantidade: { type: Number, required: true },
    },
  ],
  pago: { type: Boolean, default: false },
  criadoEm: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Carrinho", CarrinhoSchema);

