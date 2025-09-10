const express = require('express');
const router = express.Router();
const Compra = require('../models/compra');

// Criar nova compra
router.post('/', async (req, res) => {
  try {
    const novaCompra = new Compra(req.body);
    await novaCompra.save();
    res.status(201).json(novaCompra);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar compra', error: err.message });
  }
});

// Listar compras de um cliente
router.get('/:clienteId', async (req, res) => {
  try {
    const compras = await Compra.find({ cliente: req.params.clienteId }).populate('itens.produto');
    res.json(compras);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar compras', error: err.message });
  }
});

module.exports = router;