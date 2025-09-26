const express = require("express");
const router = express.Router();
const Venda = require("../models/venda");
const Compra = require("../models/compra");
const Mensagem = require("../models/mensagem");
const Produto = require("../models/produto"); // ✅ para buscar estoque inicial
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

    // Busca estoque inicial de cada produto
    const produtosComEstoque = await Promise.all(produtos.map(async (p) => {
      const produtoDB = await Produto.findById(p._id);
      const estoqueInicial = produtoDB ? produtoDB.quantidade : p.quantidade;
      return {
        ...p,
        estoqueInicial,
        total: p.preco * p.quantidade
      };
    }));

    const totalGeral = produtosComEstoque.reduce((acc, p) => acc + p.total, 0);

    // Criar Venda
    const novaVenda = new Venda({
      comprador: req.user.id,
      vendedor: vendedorId,
      produtos: produtosComEstoque,
      totalGeral,
      entregador,
      factura,
    });
    await novaVenda.save();

    // Criar Compra
    const novaCompra = new Compra({
      comprador: req.user.id,
      vendedor: vendedorId,
      produtos: produtosComEstoque,
      totalGeral,
      entregador,
      factura,
    });
    await novaCompra.save();

    // Monta mensagem detalhada
    let conteudoMsg = "🛒 Compra confirmada!\n──────────────\n\n";

    produtosComEstoque.forEach(p => {
      conteudoMsg += `• Produto: ${p.nome}\n`;
      conteudoMsg += `  Quantidade: ${p.quantidade}\n`;
      conteudoMsg += `  Estoque Inicial: ${p.estoqueInicial}\n`;
      conteudoMsg += `  Preço unitário: ${p.preco.toLocaleString()} Kz\n\n`;
    });

    conteudoMsg += `Total Geral: ${totalGeral.toLocaleString()} Kz\n\n`;

    if (entregador) {
      conteudoMsg += "🚚 Entrega:\n";
      conteudoMsg += `  Nome: ${entregador.nome}\n`;
      conteudoMsg += `  Veículo: ${entregador.veiculo}\n`;
      conteudoMsg += `  Local: ${entregador.local}, ${entregador.municipio}, ${entregador.provincia}\n`;
      conteudoMsg += `  Tarifa: ${entregador.tarifa.toLocaleString()} Kz\n`;
      conteudoMsg += `  Contacto: ${entregador.contacto}\n\n`;
    }

    conteudoMsg += "──────────────\n";
    conteudoMsg += "ℹ️ Mensagem enviada automaticamente pelo sistema";

    const mensagem = new Mensagem({
      remetente: req.user.id,
      destinatario: vendedorId,
      conteudo: conteudoMsg,
      tipo: "sistema",
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
      compra: compraPopulada,
      mensagemAutomatica: mensagem
    });
  } catch (err) {
    console.error("❌ Erro no checkout:", err);
    res.status(500).json({ msg: "Erro interno no servidor" });
  }
});

module.exports = router;
