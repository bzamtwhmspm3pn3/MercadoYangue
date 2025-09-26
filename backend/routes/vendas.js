const express = require("express");
const router = express.router();
const venda = require("../models/venda");
const { authmiddleware } = require("../middlewares/auth");

// criar venda
router.post("/", authmiddleware, async (req, res) => {
  try {
    const { vendedorid, produtos, entregador, factura } = req.body;

    if (!vendedorid || !produtos?.length) {
      return res.status(400).json({ msg: "dados incompletos." });
    }

    const novavenda = new venda({
      comprador: req.user.id,
      vendedor: vendedorid,
      produtos,
      entregador,
      factura
    });

    await novavenda.save();
    res.status(201).json({ msg: "venda registada com sucesso!", venda: novavenda });
  } catch (err) {
    console.error("erro ao registar venda:", err);
    res.status(500).json({ msg: "erro interno no servidor" });
  }
});

// listar vendas do comprador logado
router.get("/minhas", authmiddleware, async (req, res) => {
  try {
    const vendas = await venda.find({ comprador: req.user.id }).populate(
      "vendedor", "nome email"
    );
    res.json(vendas);
  } catch (err) {
    res.status(500).json({ msg: "erro ao buscar vendas do comprador" });
  }
});

// listar vendas do vendedor logado
router.get("/vendedor", authmiddleware, async (req, res) => {
  try {
    const vendas = await venda.find({ vendedor: req.user.id })
      .populate("comprador", "nome email")
      .populate("produtos.produto", "nome"); // 🔹 popula o nome do produto

    res.json(vendas);
  } catch (err) {
    res.status(500).json({ msg: "erro ao buscar vendas do vendedor" });
  }
});

// listar todas as vendas
router.get("/", authmiddleware, async (req, res) => {
  try {
    const vendas = await venda.find()
      .populate("comprador", "nome email")
      .populate("vendedor", "nome email");
    res.json(vendas);
  } catch (err) {
    res.status(500).json({ msg: "erro ao buscar vendas" });
  }
});

module.exports = router;
