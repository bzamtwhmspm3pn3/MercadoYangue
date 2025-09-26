// models/contadorfactura.js
const mongoose = require("mongoose");

const contadorfacturaschema = new mongoose.schema({
  vendedorid: { type: string, required: true, unique: true },
  ultimonumero: { type: number, default: 0 },
});

module.exports = mongoose.model("contadorfactura", contadorfacturaschema);
