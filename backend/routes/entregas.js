// routes/entregas.js
const express = require('express');
const router = express.Router();
const Entrega = require('../models/entrega');
const Usuario = require('../models/usuario');

// Solicitar nova entrega
router.post('/solicitar', async (req, res) => {
  try {
    const { clienteId, origem, destino, produtoId, observacoes } = req.body;
    
    const novaEntrega = new Entrega({
      clienteId,
      origem,
      destino,
      produtoId,
      observacoes,
      status: 'pendente'
    });
    
    await novaEntrega.save();
    res.json({ success: true, data: novaEntrega });
  } catch (error) {
    console.error('Erro solicitar entrega:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Listar entregas de um entregador
router.get('/entregador/:entregadorId', async (req, res) => {
  try {
    const entregas = await Entrega.find({ entregadorId: req.params.entregadorId })
      .populate('clienteId', 'nome telefone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: entregas });
  } catch (error) {
    console.error('Erro listar entregas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Listar entregas pendentes
router.get('/pendentes', async (req, res) => {
  try {
    const entregas = await Entrega.find({ status: 'pendente' })
      .populate('clienteId', 'nome telefone')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: entregas });
  } catch (error) {
    console.error('Erro listar entregas pendentes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Listar todas as entregas ativas
router.get('/ativas', async (req, res) => {
  try {
    const entregas = await Entrega.find({ status: { $ne: 'entregue' } })
      .populate('clienteId', 'nome telefone')
      .populate('entregadorId', 'nome telefone veiculo')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: entregas });
  } catch (error) {
    console.error('Erro listar entregas ativas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Atualizar status da entrega
router.put('/:id/status', async (req, res) => {
  try {
    const { status, localizacao } = req.body;
    const entrega = await Entrega.findById(req.params.id);
    
    if (!entrega) {
      return res.status(404).json({ success: false, message: 'Entrega não encontrada' });
    }
    
    entrega.status = status;
    if (localizacao) {
      if (!entrega.localizacoes) entrega.localizacoes = [];
      entrega.localizacoes.push({ ...localizacao, status });
    }
    if (status === 'entregue') {
      entrega.dataEntrega = new Date();
    }
    
    await entrega.save();
    res.json({ success: true, data: entrega });
  } catch (error) {
    console.error('Erro atualizar status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Atribuir entregador a uma entrega
router.put('/:id/atribuir', async (req, res) => {
  try {
    const { entregadorId } = req.body;
    const entrega = await Entrega.findByIdAndUpdate(
      req.params.id,
      { entregadorId, status: 'aceita' },
      { new: true }
    );
    res.json({ success: true, data: entrega });
  } catch (error) {
    console.error('Erro atribuir entregador:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;