const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario');
const Entrega = require('../models/entrega');

// Listar todos os entregadores
router.get('/', async (req, res) => {
  try {
    const entregadores = await Usuario.find({ tipo: 'entregador' }).select('-senha');
    res.json({ success: true, data: entregadores });
  } catch (error) {
    console.error('Erro listar entregadores:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Atualizar localização do entregador
router.put('/:id/localizacao', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await Usuario.findByIdAndUpdate(req.params.id, {
      localizacaoAtual: { lat, lng, ultimaAtualizacao: new Date() },
      disponivel: true
    });
    res.json({ success: true, message: 'Localização atualizada' });
  } catch (error) {
    console.error('Erro atualizar localização:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Buscar entregadores próximos
router.get('/proximos', async (req, res) => {
  try {
    const { lat, lng, raioKm = 50 } = req.query;
    
    const entregadores = await Usuario.find({ 
      tipo: 'entregador', 
      disponivel: true,
      'localizacaoAtual.lat': { $exists: true }
    }).select('-senha');
    
    // Filtro simples por distância (em produção use geospatial index)
    const entregadoresProximos = entregadores.filter(e => {
      if (!e.localizacaoAtual?.lat || !e.localizacaoAtual?.lng) return false;
      const distance = Math.sqrt(
        Math.pow(e.localizacaoAtual.lat - lat, 2) + 
        Math.pow(e.localizacaoAtual.lng - lng, 2)
      ) * 111;
      return distance <= raioKm;
    });
    
    res.json({ success: true, data: entregadoresProximos });
  } catch (error) {
    console.error('Erro buscar entregadores próximos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;