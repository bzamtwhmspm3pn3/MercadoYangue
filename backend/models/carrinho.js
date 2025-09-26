 const mongoose = require("mongoose");

const carrinhoschema = new mongoose.schema({
  usuario: {
    type: mongoose.schema.types.objectid,
    ref: "usuario",
    required: true,
  },
  itens: [
    {
      produto: {
        type: mongoose.schema.types.objectid,
        ref: "produto",
        required: true,
      },
      quantidade: { type: number, required: true },
    },
  ],
  pago: { type: boolean, default: false },
  criadoem: { type: date, default: date.now },
});

module.exports = mongoose.model("carrinho", carrinhoschema);

