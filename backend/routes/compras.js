const express = require("express");
const router = express.router();
const compra = require("../models/compra");
const { authmiddleware } = require("../middlewares/auth");

// criar compra
router.post("/", authmiddleware, async (req, res) => {
  try {
    const { vendedorid, produtos, entregador, factura } = req.body;

    if (!vendedorid || !produtos?.length) {
      return res.status(400).json({ msg: "dados incompletos." });
    }

    const novacompra = new compra({
      comprador: req.user.id,
      vendedor: vendedorid,
      produtos,
      entregador,
      factura
    });

    await novacompra.save();

    // popula antes de enviar a resposta
    await novacompra.populate([
      { path: "vendedor", select: "nome email" },
      { path: "produtos.produto", select: "nome" }
    ]);

    res.status(201).json({ msg: "compra registada com sucesso!", compra: novacompra });
  } catch (err) {
    console.error("erro ao registar compra:", err);
    res.status(500).json({ msg: "erro interno no servidor" });
  }
});

// listar compras do comprador logado
router.get("/minhas", authmiddleware, async (req, res) => {
  try {
    const compras = await compra.find({ comprador: req.user.id })
      .populate("vendedor", "nome email")
      .populate("produtos.produto", "nome")
      .sort({ createdat: -1 });

    res.json(compras);
  } catch (err) {
    console.error("erro ao buscar compras do comprador:", err);
    res.status(500).json({ msg: "erro ao buscar compras do comprador" });
  }
});

// listar compras do vendedor logado
router.get("/vendedor", authmiddleware, async (req, res) => {
  try {
    const compras = await compra.find({ vendedor: req.user.id })
      .populate("comprador", "nome email")
      .populate("produtos.produto", "nome")
      .sort({ createdat: -1 });

    res.json(compras);
  } catch (err) {
    console.error("erro ao buscar compras do vendedor:", err);
    res.status(500).json({ msg: "erro ao buscar compras do vendedor" });
  }
});

// listar todas as compras
router.get("/", authmiddleware, async (req, res) => {
  try {
    const compras = await compra.find()
      .populate("comprador", "nome email")
      .populate("vendedor", "nome email")
      .populate("produtos.produto", "nome")
      .sort({ createdat: -1 });

    res.json(compras);
  } catch (err) {
    console.error("erro ao buscar todas as compras:", err);
    res.status(500).json({ msg: "erro ao buscar compras" });
  }
});

module.exports = router;

