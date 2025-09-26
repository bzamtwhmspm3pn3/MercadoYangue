// routes/fatura.js
const express = require("express");
const router = express.Router();
const ContadorFactura = require("../models/contadorfactura");

router.post("/proximo-numero", async (req, res) => {
  try {
    const { vendedorId } = req.body;
    if (!vendedorId) return res.status(400).json({ error: "vendedorId obrigatório" });

    const contador = await ContadorFactura.findOneAndUpdate(
      { vendedorId },
      { $inc: { ultimoNumero: 1 } },
      { new: true, upsert: true }
    );

    const anoAtual = new Date().getFullYear();
    const numeroFactura = `FT-MY: ${String(contador.ultimoNumero).padStart(4, "0")}/${anoAtual}`;

    res.json({ numeroFactura, numeroSequencial: contador.ultimoNumero });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar número da factura" });
  }
});

module.exports = router;
