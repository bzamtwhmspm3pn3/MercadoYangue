const express = require("express");
const router = express.Router();
const Venda = require("../models/venda");
const { authMiddleware } = require("../middlewares/auth");

// Criar venda
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { vendedorId, produtos, entregador, factura } = req.body;

    if (!vendedorId || !produtos?.length) {
      return res.status(400).json({ msg: "Dados incompletos." });
    }

    const novaVenda = new Venda({
      comprador: req.user.id,
      vendedor: vendedorId,
      produtos,
      entregador,
      factura
    });

    await novaVenda.save();
    res.status(201).json({ msg: "Venda registada com sucesso!", venda: novaVenda });
  } catch (err) {
    console.error("Erro ao registar venda:", err);
    res.status(500).json({ msg: "Erro interno no servidor" });
  }
});

// Listar vendas do comprador logado
router.get("/minhas", authMiddleware, async (req, res) => {
  try {
    const vendas = await Venda.find({ comprador: req.user.id }).populate(
      "vendedor", "nome email"
    );
    res.json(vendas);
  } catch (err) {
    res.status(500).json({ msg: "Erro ao buscar vendas do comprador" });
  }
});

// Listar vendas do vendedor logado
router.get("/vendedor", authMiddleware, async (req, res) => {
  try {
    const vendas = await Venda.find({ vendedor: req.user.id })
      .populate("comprador", "nome email")
      .populate("produtos.produto", "nome"); // 🔹 Popula o nome do produto

    res.json(vendas);
  } catch (err) {
    res.status(500).json({ msg: "Erro ao buscar vendas do vendedor" });
  }
});

// Listar todas as vendas
router.get("/", authMiddleware, async (req, res) => {
  try {
    const vendas = await Venda.find()
      .populate("comprador", "nome email")
      .populate("vendedor", "nome email");
    res.json(vendas);
  } catch (err) {
    res.status(500).json({ msg: "Erro ao buscar vendas" });
  }
});

module.exports = router;
