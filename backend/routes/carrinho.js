const express = require("express");
const router = express.router();
const { authmiddleware } = require("../middlewares/auth");
const produto = require("../models/produto");
const carrinho = require("../models/carrinho");
const pedido = require("../models/pedido");


const atualizarhistorico = async () => {
  const token = localstorage.getitem("token");
  const res = await fetch("https://mercadoyangue.netlify.app/api/carrinho/historico", {
    headers: { authorization: `bearer ${token}` },
  });
  if (!res.ok) throw new error("erro ao carregar histórico");
  const dados = await res.json();
  sethistoricocarrinhos(dados || []);
};


// 🔹 adicionar item ao carrinho
router.post("/add", authmiddleware, async (req, res) => {
  try {
    const { produtoid, quantidade } = req.body;
    if (!quantidade || quantidade <= 0) return res.status(400).json({ msg: "quantidade inválida" });

    const produto = await produto.findbyid(produtoid);
    if (!produto) return res.status(404).json({ msg: "produto não encontrado" });

    if ((produto.reservados || 0) + quantidade > produto.quantidade) {
      return res.status(400).json({ msg: `stock insuficiente para ${produto.nome}` });
    }

    let carrinho = await carrinho.findone({ usuario: req.user.id, pago: false }).populate("itens.produto");
    if (!carrinho) carrinho = new carrinho({ usuario: req.user.id, itens: [] });

    const existente = carrinho.itens.find(i => i.produto._id.tostring() === produtoid);

    if (existente) {
      existente.quantidade += quantidade;
    } else {
      carrinho.itens.push({ produto: produtoid, quantidade });
    }

    produto.reservados = (produto.reservados || 0) + quantidade;
    await produto.save();

    await carrinho.save();
    await carrinho.populate("itens.produto");

    const total = carrinho.itens.reduce((acc, i) => acc + (i.produto?.preco || 0) * i.quantidade, 0);
    res.json({ msg: "produto atualizado no carrinho", carrinho, total });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "erro ao adicionar ao carrinho" });
  }
});

// 🔹 buscar carrinho do usuário logado
router.get("/meu", authmiddleware, async (req, res) => {
  try {
    const carrinho = await carrinho.findone({ usuario: req.user.id, pago: false }).populate({
      path: "itens.produto",
      populate: { path: "vendedor", select: "nome contacto formapagamento" },
    });

    if (!carrinho) return res.json({ itens: [], total: 0 });

    const total = carrinho.itens.reduce((acc, i) => acc + (i.produto?.preco || 0) * i.quantidade, 0);
    res.json({ ...carrinho.toobject(), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "erro ao buscar carrinho" });
  }
});

// 🔹 remover item do carrinho
router.delete("/remove/:itemid", authmiddleware, async (req, res) => {
  try {
    const { itemid } = req.params;
    const carrinho = await carrinho.findone({ usuario: req.user.id, pago: false }).populate("itens.produto");
    if (!carrinho) return res.status(404).json({ msg: "carrinho não encontrado" });

    const itemremover = carrinho.itens.find(i => i._id.tostring() === itemid);
    if (itemremover) {
      const produto = await produto.findbyid(itemremover.produto._id);
      if (produto) {
        produto.reservados = math.max(produto.reservados - itemremover.quantidade, 0);
        await produto.save();
      }
    }

    carrinho.itens = carrinho.itens.filter(i => i._id.tostring() !== itemid);
    await carrinho.save();

    const total = carrinho.itens.reduce((acc, i) => acc + (i.produto?.preco || 0) * i.quantidade, 0);
    res.json({ msg: "item removido com sucesso", carrinho, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "erro ao remover item" });
  }
});

// 🔹 checkout
router.post("/checkout", authmiddleware, async (req, res) => {
  try {
    const { metodopagamento, referencia } = req.body;

    const carrinho = await carrinho.findone({ usuario: req.user.id, pago: false })
      .populate({
        path: "itens.produto",
        populate: { path: "vendedor", select: "nome contacto formapagamento" },
      });

    if (!carrinho || carrinho.itens.length === 0)
      return res.status(400).json({ msg: "carrinho vazio" });

    for (const item of carrinho.itens) {
      const produto = await produto.findbyid(item.produto._id);
      if (!produto) continue;

      if (produto.quantidade < item.quantidade)
        return res.status(400).json({ msg: `stock insuficiente para ${produto.nome}` });

      produto.quantidade -= item.quantidade;
      produto.reservados = math.max(produto.reservados - item.quantidade, 0);
      await produto.save();
    }

    const total = carrinho.itens.reduce((acc, i) => acc + (i.produto?.preco || 0) * i.quantidade, 0);

    const pedido = await pedido.create({
      usuario: req.user.id,
      itens: carrinho.itens.map(i => ({
        produto: i.produto._id,
        quantidade: i.quantidade,
        precounitario: i.produto.preco,
        vendedor: i.produto.vendedor?._id || null,
        contacto: i.produto.vendedor?.contacto || "não informado",
      })),
      metodopagamento: metodopagamento || carrinho.itens[0]?.produto.vendedor?.formapagamento?.tipo || "não informado",
      referencia: referencia || "n/a",
      status: "pago",
      total,
      criadoem: new date(),
    });

    // marca carrinho como pago
    carrinho.itens = [];
    carrinho.pago = true;
    await carrinho.save();

    res.json({
      msg: "✅ pagamento confirmado | stock atualizado | carrinho finalizado",
      pedido,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "erro no checkout" });
  }
});

// 🔹 histórico de pedidos pagos
router.get("/historico", authmiddleware, async (req, res) => {
  try {
    const pedidos = await pedido.find({ usuario: req.user.id }).sort({ criadoem: -1 }).populate({
      path: "itens.produto",
      populate: { path: "vendedor", select: "nome contacto formapagamento" },
    });

    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "erro ao buscar histórico de pedidos" });
  }
});

module.exports = router;
