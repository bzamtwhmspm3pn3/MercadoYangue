const express = require("express");
const router = express.Router();
const Compra = require("../models/Compra");
const { authMiddleware } = require("../middlewares/auth");

// Criar compra
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { vendedorId, produtos, entregador, factura } = req.body;

    if (!vendedorId || !produtos?.length) {
      return res.status(400).json({ msg: "Dados incompletos." });
    }

    const novaCompra = new Compra({
      comprador: req.user.id,
      vendedor: vendedorId,
      produtos,
      entregador,
      factura
    });

    await novaCompra.save();

    // popula antes de enviar a resposta
    await novaCompra.populate([
      { path: "vendedor", select: "nome email" },
      { path: "produtos.produto", select: "nome" }
    ]);

    res.status(201).json({ msg: "Compra registada com sucesso!", compra: novaCompra });
  } catch (err) {
    console.error("Erro ao registar compra:", err);
    res.status(500).json({ msg: "Erro interno no servidor" });
  }
});

// Listar compras do comprador logado
router.get("/minhas", authMiddleware, async (req, res) => {
  try {
    const compras = await Compra.find({ comprador: req.user.id })
      .populate("vendedor", "nome email")
      .populate("produtos.produto", "nome")
      .sort({ createdAt: -1 });

    res.json(compras);
  } catch (err) {
    console.error("Erro ao buscar compras do comprador:", err);
    res.status(500).json({ msg: "Erro ao buscar compras do comprador" });
  }
});

// Listar compras do vendedor logado
router.get("/vendedor", authMiddleware, async (req, res) => {
  try {
    const compras = await Compra.find({ vendedor: req.user.id })
      .populate("comprador", "nome email")
      .populate("produtos.produto", "nome")
      .sort({ createdAt: -1 });

    res.json(compras);
  } catch (err) {
    console.error("Erro ao buscar compras do vendedor:", err);
    res.status(500).json({ msg: "Erro ao buscar compras do vendedor" });
  }
});

// Listar todas as compras
router.get("/", authMiddleware, async (req, res) => {
  try {
    const compras = await Compra.find()
      .populate("comprador", "nome email")
      .populate("vendedor", "nome email")
      .populate("produtos.produto", "nome")
      .sort({ createdAt: -1 });

    res.json(compras);
  } catch (err) {
    console.error("Erro ao buscar todas as compras:", err);
    res.status(500).json({ msg: "Erro ao buscar compras" });
  }
});

module.exports = router;

