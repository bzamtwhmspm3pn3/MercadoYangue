const express = require("express");
const router = express.Router();
const Venda = require("../models/venda");
const Compra = require("../models/compra");
const Mensagem = require("../models/mensagem"); // ✅ modelo atualizado
const { authMiddleware } = require("../middlewares/auth");

// Checkout: cria venda, compra e dispara mensagem automática
router.post("/", authMiddleware, async (req, res) => {
  try {
    console.log("🚨 Dados recebidos no backend (req.body):", JSON.stringify(req.body, null, 2));
    console.log("🚨 Usuário autenticado (req.user):", req.user);

    const { vendedorId, produtos, entregador, factura } = req.body;

    if (!vendedorId || !produtos?.length) {
      return res.status(400).json({ msg: "Dados incompletos." });
    }

    // Calcular total de cada produto e totalGeral
    const produtosComTotal = produtos.map(p => ({
      ...p,
      total: p.preco * p.quantidade
    }));
    const totalGeral = produtosComTotal.reduce((acc, p) => acc + p.total, 0);

    // Criar Venda
    const novaVenda = new Venda({
      comprador: req.user.id,
      vendedor: vendedorId,
      produtos: produtosComTotal,
      totalGeral,
      entregador,
      factura,
    });
    await novaVenda.save();

    // Criar Compra
    const novaCompra = new Compra({
      comprador: req.user.id,
      vendedor: vendedorId,
      produtos: produtosComTotal,
      totalGeral,
      entregador,
      factura,
    });
    await novaCompra.save();

  // Criar Mensagem automática para o vendedor
const mensagem = new Mensagem({
  remetente: req.user.id,       // comprador
  destinatario: vendedorId,     // vendedor
  conteudo: `🛒 Novo pedido registado no valor de ${totalGeral} KZ. Consulte os detalhes na sua área de vendas.`,
  tipo: "sistema",              // extra, para diferenciar msg automática
  lida: false
});
await mensagem.save();



    // 🔹 Popula os refs antes de enviar
    const compraPopulada = await Compra.findById(novaCompra._id)
      .populate("vendedor", "nome")
      .populate("produtos.produto", "nome");

    res.status(201).json({
      msg: "✅ Compra e venda registadas com sucesso! Mensagem enviada ao vendedor.",
      venda: novaVenda,
      compra: compraPopulada, // com nomes populados
      mensagemAutomatica: mensagem
    });
  } catch (err) {
    console.error("❌ Erro no checkout:", err);
    res.status(500).json({ msg: "Erro interno no servidor" });
  }
});

module.exports = router;
