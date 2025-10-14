const mongoose = require("mongoose");

// Subschema produtos
const ProdutoCompraSchema = new mongoose.Schema({
  produto: { type: mongoose.Schema.Types.ObjectId, ref: "Produto", required: true },
  nomeProduto: { type: String }, // <-- novo campo espelho
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
  tipo: { type: String, enum: ["manual", "autofactura"], default: "manual" }
}, { _id: false });

// Schema principal
const CompraSchema = new mongoose.Schema({
  comprador: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  compradorNome: { type: String }, // <-- novo campo espelho

  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  vendedorNome: { type: String }, // <-- novo campo espelho

  produtos: [ProdutoCompraSchema],
  totalGeral: { type: Number, required: true },
  entregador: EntregadorSchema,
  factura: FacturaSchema
}, { timestamps: true });

// Middleware para preencher nomes e calcular total
CompraSchema.pre("save", async function(next) {
  try {
    const Usuario = mongoose.model("Usuario");
    const Produto = mongoose.model("Produto");

    // Puxa nomes dos usuários
    if (this.comprador) {
      const comp = await Usuario.findById(this.comprador).lean();
      this.compradorNome = comp ? comp.nome : "Usuário eliminado";
    }

    if (this.vendedor) {
      const vend = await Usuario.findById(this.vendedor).lean();
      this.vendedorNome = vend ? vend.nome : "Usuário eliminado";
    }

    // Puxa nomes dos produtos
    for (const item of this.produtos) {
      if (item.produto) {
        const prod = await Produto.findById(item.produto).lean();
        item.nomeProduto = prod ? prod.nome : "Produto eliminado";
      }
    }

    // Calcula total geral
    this.totalGeral = this.produtos.reduce((acc, p) => acc + p.preco * p.quantidade, 0);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.models.Compra || mongoose.model("Compra", CompraSchema);
