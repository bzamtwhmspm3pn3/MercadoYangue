const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const Produto = require("../models/produto");
const Carrinho = require("../models/carrinho");
const Pedido = require("../models/pedido");


const atualizarHistorico = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:5000/api/carrinho/historico", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Erro ao carregar histórico");
  const dados = await res.json();
  setHistoricoCarrinhos(dados || []);
};


// 🔹 Adicionar item ao carrinho
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { produtoId, quantidade } = req.body;
    if (!quantidade || quantidade <= 0) return res.status(400).json({ msg: "Quantidade inválida" });

    const produto = await Produto.findById(produtoId);
    if (!produto) return res.status(404).json({ msg: "Produto não encontrado" });

    if ((produto.reservados || 0) + quantidade > produto.quantidade) {
      return res.status(400).json({ msg: `Stock insuficiente para ${produto.nome}` });
    }

    let carrinho = await Carrinho.findOne({ usuario: req.user.id, pago: false }).populate("itens.produto");
    if (!carrinho) carrinho = new Carrinho({ usuario: req.user.id, itens: [] });

    const existente = carrinho.itens.find(i => i.produto._id.toString() === produtoId);

    if (existente) {
      existente.quantidade += quantidade;
    } else {
      carrinho.itens.push({ produto: produtoId, quantidade });
    }

    produto.reservados = (produto.reservados || 0) + quantidade;
    await produto.save();

    await carrinho.save();
    await carrinho.populate("itens.produto");

    const total = carrinho.itens.reduce((acc, i) => acc + (i.produto?.preco || 0) * i.quantidade, 0);
    res.json({ msg: "Produto atualizado no carrinho", carrinho, total });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro ao adicionar ao carrinho" });
  }
});

// 🔹 Buscar carrinho do usuário logado
router.get("/meu", authMiddleware, async (req, res) => {
  try {
    const carrinho = await Carrinho.findOne({ usuario: req.user.id, pago: false }).populate({
      path: "itens.produto",
      populate: { path: "vendedor", select: "nome contacto formaPagamento" },
    });

    if (!carrinho) return res.json({ itens: [], total: 0 });

    const total = carrinho.itens.reduce((acc, i) => acc + (i.produto?.preco || 0) * i.quantidade, 0);
    res.json({ ...carrinho.toObject(), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro ao buscar carrinho" });
  }
});

// 🔹 Remover item do carrinho
router.delete("/remove/:itemId", authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const carrinho = await Carrinho.findOne({ usuario: req.user.id, pago: false }).populate("itens.produto");
    if (!carrinho) return res.status(404).json({ msg: "Carrinho não encontrado" });

    const itemRemover = carrinho.itens.find(i => i._id.toString() === itemId);
    if (itemRemover) {
      const produto = await Produto.findById(itemRemover.produto._id);
      if (produto) {
        produto.reservados = Math.max(produto.reservados - itemRemover.quantidade, 0);
        await produto.save();
      }
    }

    carrinho.itens = carrinho.itens.filter(i => i._id.toString() !== itemId);
    await carrinho.save();

    const total = carrinho.itens.reduce((acc, i) => acc + (i.produto?.preco || 0) * i.quantidade, 0);
    res.json({ msg: "Item removido com sucesso", carrinho, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro ao remover item" });
  }
});

// 🔹 Checkout
router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    const { metodoPagamento, referencia } = req.body;

    const carrinho = await Carrinho.findOne({ usuario: req.user.id, pago: false })
      .populate({
        path: "itens.produto",
        populate: { path: "vendedor", select: "nome contacto formaPagamento" },
      });

    if (!carrinho || carrinho.itens.length === 0)
      return res.status(400).json({ msg: "Carrinho vazio" });

    for (const item of carrinho.itens) {
      const produto = await Produto.findById(item.produto._id);
      if (!produto) continue;

      if (produto.quantidade < item.quantidade)
        return res.status(400).json({ msg: `Stock insuficiente para ${produto.nome}` });

      produto.quantidade -= item.quantidade;
      produto.reservados = Math.max(produto.reservados - item.quantidade, 0);
      await produto.save();
    }

    const total = carrinho.itens.reduce((acc, i) => acc + (i.produto?.preco || 0) * i.quantidade, 0);

    const pedido = await Pedido.create({
      usuario: req.user.id,
      itens: carrinho.itens.map(i => ({
        produto: i.produto._id,
        quantidade: i.quantidade,
        precoUnitario: i.produto.preco,
        vendedor: i.produto.vendedor?._id || null,
        contacto: i.produto.vendedor?.contacto || "Não informado",
      })),
      metodoPagamento: metodoPagamento || carrinho.itens[0]?.produto.vendedor?.formaPagamento?.tipo || "Não informado",
      referencia: referencia || "N/A",
      status: "Pago",
      total,
      criadoEm: new Date(),
    });

    // Marca carrinho como pago
    carrinho.itens = [];
    carrinho.pago = true;
    await carrinho.save();

    res.json({
      msg: "✅ Pagamento confirmado | Stock atualizado | Carrinho finalizado",
      pedido,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no checkout" });
  }
});

// 🔹 Histórico de pedidos pagos
router.get("/historico", authMiddleware, async (req, res) => {
  try {
    const pedidos = await Pedido.find({ usuario: req.user.id }).sort({ criadoEm: -1 }).populate({
      path: "itens.produto",
      populate: { path: "vendedor", select: "nome contacto formaPagamento" },
    });

    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro ao buscar histórico de pedidos" });
  }
});

module.exports = router;
