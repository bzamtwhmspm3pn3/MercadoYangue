const express = require('express');
const router = express.Router();
const Venda = require('../models/venda');
const Produto = require('../models/produto');

// Confirmar pagamento (checkout)
router.post('/checkout', async (req, res) => {
  try {
    const { vendedor, itens, total } = req.body;

    // Atualizar stock de cada produto
    for (const item of itens) {
      await Produto.findByIdAndUpdate(item.produto, {
        $inc: { quantidade: -item.quantidade }
      });
    }

    // Criar venda
    const novaVenda = new Venda({ vendedor, itens, total, status: 'concluída' });
    await novaVenda.save();

    res.status(201).json(novaVenda);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao confirmar pagamento', error: err.message });
  }
});

module.exports = router;
