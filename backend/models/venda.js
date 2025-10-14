const mongoose = require("mongoose");

// Subschema produtos
const ProdutoVendaSchema = new mongoose.Schema({
  produto: { type: mongoose.Schema.Types.ObjectId, ref: "Produto", required: true },
  quantidade: { type: Number, required: true },
  preco: { type: Number, required: true } // preço unitário
}, { _id: false });

// Subschema entregador
const EntregadorSchema = new mongoose.Schema({
  nome: String,
  veiculo: String,
  provincia: String,
  municipio: String,
  local: String,
  pagamento: String,
  tarifa: Number,
  contacto: String
}, { _id: false });

// Subschema factura
const FacturaSchema = new mongoose.Schema({
  tipo: { type: String, enum: ["manual", "autofactura"], default: "manual" },
  numero: { type: String },
  dataEmissao: { type: Date, default: Date.now }
}, { _id: false });

// Schema principal
const VendaSchema = new mongoose.Schema({
  comprador: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  produtos: { type: [ProdutoVendaSchema], required: true },
  totalGeral: { type: Number, default: 0 },
  entregador: EntregadorSchema,
  factura: FacturaSchema,
  estado: { type: String, enum: ["pendente", "concluída", "cancelada"], default: "pendente" }
}, { timestamps: true });

// Middleware para calcular totalGeral
VendaSchema.pre("save", function (next) {
  this.totalGeral = this.produtos.reduce((acc, p) => acc + p.preco * p.quantidade, 0);
  next();
});

module.exports = mongoose.models.Venda || mongoose.model("Venda", VendaSchema);
