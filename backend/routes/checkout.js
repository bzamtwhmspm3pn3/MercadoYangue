const express = require("express");
const router = express.router();
const venda = require("../models/venda");
const compra = require("../models/compra");
const mensagem = require("../models/mensagem");
const produto = require("../models/produto"); // ✅ para buscar estoque inicial
const { authmiddleware } = require("../middlewares/auth");

// checkout: cria venda, compra e dispara mensagem automática
router.post("/", authmiddleware, async (req, res) => {
  try {
    console.log("🚨 dados recebidos no backend (req.body):", json.stringify(req.body, null, 2));
    console.log("🚨 usuário autenticado (req.user):", req.user);

    const { vendedorid, produtos, entregador, factura } = req.body;

    if (!vendedorid || !produtos?.length) {
      return res.status(400).json({ msg: "dados incompletos." });
    }

    // busca estoque inicial de cada produto
    const produtoscomestoque = await promise.all(produtos.map(async (p) => {
      const produtodb = await produto.findbyid(p._id);
      const estoqueinicial = produtodb ? produtodb.quantidade : p.quantidade;
      return {
        ...p,
        estoqueinicial,
        total: p.preco * p.quantidade
      };
    }));

    const totalgeral = produtoscomestoque.reduce((acc, p) => acc + p.total, 0);

    // criar venda
    const novavenda = new venda({
      comprador: req.user.id,
      vendedor: vendedorid,
      produtos: produtoscomestoque,
      totalgeral,
      entregador,
      factura,
    });
    await novavenda.save();

    // criar compra
    const novacompra = new compra({
      comprador: req.user.id,
      vendedor: vendedorid,
      produtos: produtoscomestoque,
      totalgeral,
      entregador,
      factura,
    });
    await novacompra.save();

    // monta mensagem detalhada
    let conteudomsg = "🛒 compra confirmada!\n──────────────\n\n";

    produtoscomestoque.foreach(p => {
      conteudomsg += `• produto: ${p.nome}\n`;
      conteudomsg += `  quantidade: ${p.quantidade}\n`;
      conteudomsg += `  estoque inicial: ${p.estoqueinicial}\n`;
      conteudomsg += `  preço unitário: ${p.preco.tolocalestring()} kz\n\n`;
    });

    conteudomsg += `total geral: ${totalgeral.tolocalestring()} kz\n\n`;

    if (entregador) {
      conteudomsg += "🚚 entrega:\n";
      conteudomsg += `  nome: ${entregador.nome}\n`;
      conteudomsg += `  veículo: ${entregador.veiculo}\n`;
      conteudomsg += `  local: ${entregador.local}, ${entregador.municipio}, ${entregador.provincia}\n`;
      conteudomsg += `  tarifa: ${entregador.tarifa.tolocalestring()} kz\n`;
      conteudomsg += `  contacto: ${entregador.contacto}\n\n`;
    }

    conteudomsg += "──────────────\n";
    conteudomsg += "ℹ️ mensagem enviada automaticamente pelo sistema";

    const mensagem = new mensagem({
      remetente: req.user.id,
      destinatario: vendedorid,
      conteudo: conteudomsg,
      tipo: "sistema",
      lida: false
    });

    await mensagem.save();

    // 🔹 popula os refs antes de enviar
    const comprapopulada = await compra.findbyid(novacompra._id)
      .populate("vendedor", "nome")
      .populate("produtos.produto", "nome");

    res.status(201).json({
      msg: "✅ compra e venda registadas com sucesso! mensagem enviada ao vendedor.",
      venda: novavenda,
      compra: comprapopulada,
      mensagemautomatica: mensagem
    });
  } catch (err) {
    console.error("❌ erro no checkout:", err);
    res.status(500).json({ msg: "erro interno no servidor" });
  }
});

module.exports = router;
