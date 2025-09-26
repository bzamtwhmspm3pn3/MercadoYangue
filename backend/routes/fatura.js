// routes/fatura.js
const express = require("express");
const router = express.router();
const contadorfactura = require("../models/contadorfactura");

router.post("/proximo-numero", async (req, res) => {
  try {
    const { vendedorid } = req.body;
    if (!vendedorid) return res.status(400).json({ error: "vendedorid obrigatório" });

    const contador = await contadorfactura.findoneandupdate(
      { vendedorid },
      { $inc: { ultimonumero: 1 } },
      { new: true, upsert: true }
    );

    const anoatual = new date().getfullyear();
    const numerofactura = `ft-my: ${string(contador.ultimonumero).padstart(4, "0")}/${anoatual}`;

    res.json({ numerofactura, numerosequencial: contador.ultimonumero });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erro ao gerar número da factura" });
  }
});

module.exports = router;
