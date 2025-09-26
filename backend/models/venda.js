const mongoose = require("mongoose");

// subschema produtos
const produtovendaschema = new mongoose.schema({
  produto: { type: mongoose.schema.types.objectid, ref: "produto", required: true },
  quantidade: { type: number, required: true },
  preco: { type: number, required: true } // preço unitário
}, { _id: false });

// subschema entregador
const entregadorschema = new mongoose.schema({
  nome: string,
  veiculo: string,
  provincia: string,
  municipio: string,
  local: string,
  pagamento: string,
  tarifa: number,
  contacto: string
}, { _id: false });

// subschema factura
const facturaschema = new mongoose.schema({
  tipo: { type: string, enum: ["manual", "autofactura"], default: "manual" }
}, { _id: false });

// schema principal
const vendaschema = new mongoose.schema({
  comprador: { type: mongoose.schema.types.objectid, ref: "usuario", required: true },
  vendedor: { type: mongoose.schema.types.objectid, ref: "usuario", required: true },
  produtos: [produtovendaschema],
  totalgeral: { type: number, required: true },
  entregador: entregadorschema,
  factura: facturaschema
}, { timestamps: true });

// middleware para calcular totalgeral
vendaschema.pre("save", function(next) {
  this.totalgeral = this.produtos.reduce((acc, p) => acc + p.preco * p.quantidade, 0);
  next();
});

module.exports = mongoose.models.venda || mongoose.model("venda", vendaschema);
