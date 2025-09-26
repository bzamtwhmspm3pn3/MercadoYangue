// models/ContadorFactura.js
const mongoose = require("mongoose");

const contadorFacturaSchema = new mongoose.Schema({
  vendedorId: { type: String, required: true, unique: true },
  ultimoNumero: { type: Number, default: 0 },
});

module.exports = mongoose.model("ContadorFactura", contadorFacturaSchema);
