const express = require('express');
const router = express.Router();
const Produto = require('../models/Produto');
const Usuario = require('../models/Usuario');

// Rota para buscar vendedores que possuem produtos com nome parecido
router.get('/buscar-vendedores', async (req, res) => {
  try {
    const { nomeProduto } = req.query;
    if (!nomeProduto) {
      return res.status(400).json({ msg: 'Parâmetro nomeProduto é obrigatório' });
    }

    // Busca produtos que contenham o termo no nome (case insensitive)
    const produtos = await Produto.find({
      nome: { $regex: nomeProduto, $options: 'i' },
      quantidade: { $gt: 0 }, // só produtos em estoque
    }).populate('vendedor', 'nome tipo telefone email');

    // Extraí os vendedores únicos
    const vendedoresMap = new Map();
    produtos.forEach((produto) => {
      if (produto.vendedor) {
        vendedoresMap.set(produto.vendedor._id.toString(), produto.vendedor);
      }
    });

    const vendedores = Array.from(vendedoresMap.values());

    res.json(vendedores);
  } catch (error) {
    console.error('Erro buscar vendedores:', error);
    res.status(500).json({ msg: 'Erro interno no servidor' });
  }
});

module.exports = router;
