const express = require('express');
const router = express.router();
const produto = require('../models/produto');
const usuario = require('../models/usuario');

// rota para buscar vendedores que possuem produtos com nome parecido
router.get('/buscar-vendedores', async (req, res) => {
  try {
    const { nomeproduto } = req.query;
    if (!nomeproduto) {
      return res.status(400).json({ msg: 'parâmetro nomeproduto é obrigatório' });
    }

    // busca produtos que contenham o termo no nome (case insensitive)
    const produtos = await produto.find({
      nome: { $regex: nomeproduto, $options: 'i' },
      quantidade: { $gt: 0 }, // só produtos em estoque
    }).populate('vendedor', 'nome tipo telefone email');

    // extraí os vendedores únicos
    const vendedoresmap = new map();
    produtos.foreach((produto) => {
      if (produto.vendedor) {
        vendedoresmap.set(produto.vendedor._id.tostring(), produto.vendedor);
      }
    });

    const vendedores = array.from(vendedoresmap.values());

    res.json(vendedores);
  } catch (error) {
    console.error('erro buscar vendedores:', error);
    res.status(500).json({ msg: 'erro interno no servidor' });
  }
});

module.exports = router;
