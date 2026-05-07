// routes/entregas.js
const express = require('express');
const router = express.Router();
const Entrega = require('../models/entrega');
const Usuario = require('../models/usuario');

// Solicitar nova entrega
router.post('/solicitar', async (req, res) => {
  try {
    const { clienteId, origem, destino, produtoId, observacoes, entregadorId } = req.body;
    
    const novaEntrega = new Entrega({
      clienteId,
      origem,
      destino,
      produtoId,
      entregadorId: entregadorId || null,
      observacoes,
      status: entregadorId ? 'aceita' : 'pendente'
    });
    
    await novaEntrega.save();
    
    // Se tiver entregador, notificar
    if (entregadorId) {
      const entregador = await Usuario.findById(entregadorId);
      // Aqui poderia enviar notificação via socket
    }
    
    res.json({ success: true, data: novaEntrega, message: 'Entrega solicitada com sucesso' });
  } catch (error) {
    console.error('Erro solicitar entrega:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Listar entregas de um entregador
router.get('/entregador/:entregadorId', async (req, res) => {
  try {
    const entregas = await Entrega.find({ entregadorId: req.params.entregadorId })
      .populate('clienteId', 'nome telefone email')
      .populate('produtoId', 'nome preco imagem')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: entregas });
  } catch (error) {
    console.error('Erro listar entregas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Listar entregas de um cliente
router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const entregas = await Entrega.find({ clienteId: req.params.clienteId })
      .populate('entregadorId', 'nome telefone veiculo placa')
      .populate('produtoId', 'nome preco imagem')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: entregas });
  } catch (error) {
    console.error('Erro listar entregas do cliente:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Listar entregas pendentes
router.get('/pendentes', async (req, res) => {
  try {
    const entregas = await Entrega.find({ status: 'pendente' })
      .populate('clienteId', 'nome telefone endereco')
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
    const entregas = await Entrega.find({ status: { $nin: ['entregue', 'cancelada'] } })
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
      entrega.localizacoes.push({ ...localizacao, status, timestamp: new Date() });
    }
    if (status === 'entregue') {
      entrega.dataEntrega = new Date();
    }
    
    await entrega.save();
    
    // Notificar cliente via socket se houver
    res.json({ success: true, data: entrega, message: `Status atualizado para ${status}` });
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
    ).populate('entregadorId', 'nome telefone veiculo');
    
    res.json({ success: true, data: entrega, message: 'Entregador atribuído com sucesso' });
  } catch (error) {
    console.error('Erro atribuir entregador:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Buscar entrega por ID
router.get('/:id', async (req, res) => {
  try {
    const entrega = await Entrega.findById(req.params.id)
      .populate('clienteId', 'nome telefone email')
      .populate('entregadorId', 'nome telefone veiculo placa')
      .populate('produtoId', 'nome preco imagem');
    
    if (!entrega) {
      return res.status(404).json({ success: false, message: 'Entrega não encontrada' });
    }
    
    res.json({ success: true, data: entrega });
  } catch (error) {
    console.error('Erro buscar entrega:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancelar entrega
router.delete('/:id', async (req, res) => {
  try {
    const entrega = await Entrega.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelada' },
      { new: true }
    );
    res.json({ success: true, data: entrega, message: 'Entrega cancelada' });
  } catch (error) {
    console.error('Erro cancelar entrega:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;