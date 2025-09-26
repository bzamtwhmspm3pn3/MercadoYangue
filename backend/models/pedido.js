const mongoose = require("mongoose");

const pedidoschema = new mongoose.schema({
  usuario: {
    type: mongoose.schema.types.objectid,
    ref: "usuario", // quem fez a compra
    required: true,
  },
  itens: [
    {
      produto: {
        type: mongoose.schema.types.objectid,
        ref: "produto", // produto comprado
        required: true,
      },
      quantidade: {
        type: number,
        required: true,
        min: 1,
      },
      precounitario: {
        type: number,
        required: true,
        min: 0,
      },
    },
  ],
  metodopagamento: {
    type: string,
    required: true,
    default: "não informado",
  },
  referencia: {
    type: string,
    default: "n/a",
  },
  vendedor: {
    type: string, // nome do vendedor (copiado do usuario no momento do checkout)
    default: "não informado",
  },
  contacto: {
    type: string, // contacto do vendedor
    default: "não informado",
  },
  total: {
    type: number,
    required: true,
    min: 0,
  },
  status: {
    type: string,
    enum: ["pendente", "pago", "cancelado"],
    default: "pendente",
  },
  criadoem: {
    type: date,
    default: date.now,
  },
});

module.exports = mongoose.model("pedido", pedidoschema);


