const mongoose = require("mongoose");

const PedidoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario", // quem fez a compra
    required: true,
  },
  itens: [
    {
      produto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Produto", // produto comprado
        required: true,
      },
      quantidade: {
        type: Number,
        required: true,
        min: 1,
      },
      precoUnitario: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  metodoPagamento: {
    type: String,
    required: true,
    default: "Não informado",
  },
  referencia: {
    type: String,
    default: "N/A",
  },
  vendedor: {
    type: String, // nome do vendedor (copiado do Usuario no momento do checkout)
    default: "Não informado",
  },
  contacto: {
    type: String, // contacto do vendedor
    default: "Não informado",
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["Pendente", "Pago", "Cancelado"],
    default: "Pendente",
  },
  criadoEm: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Pedido", PedidoSchema);


