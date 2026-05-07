// routes/geolocalizacao.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Schema para rastreamento de produção
const RastreamentoSchema = new mongoose.Schema({
  produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
  vendedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  localizacaoAtual: {
    lat: Number,
    lng: Number,
    provincia: String,
    municipio: String,
    endereco: String
  },
  historico: [{
    lat: Number,
    lng: Number,
    provincia: String,
    municipio: String,
    etapa: { type: String, enum: ['plantio', 'crescimento', 'colheita', 'transporte', 'entrega'] },
    timestamp: { type: Date, default: Date.now },
    observacao: String
  }],
  status: { type: String, enum: ['plantio', 'crescimento', 'colheita', 'transporte', 'entregue'], default: 'plantio' },
  areaCultivo: Number, // em hectares
  previsaoColheita: Date,
  createdAt: { type: Date, default: Date.now }
});

const Rastreamento = mongoose.model('Rastreamento', RastreamentoSchema);

// Iniciar rastreamento de um produto
router.post('/iniciar', async (req, res) => {
  try {
    const { produtoId, vendedorId, localizacao, areaCultivo, previsaoColheita } = req.body;
    
    const novoRastreamento = new Rastreamento({
      produtoId,
      vendedorId,
      localizacaoAtual: localizacao,
      historico: [{ ...localizacao, etapa: 'plantio' }],
      areaCultivo,
      previsaoColheita
    });
    
    await novoRastreamento.save();
    res.json({ success: true, data: novoRastreamento });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Atualizar estágio de produção
router.put('/atualizar/:rastreamentoId', async (req, res) => {
  try {
    const { etapa, localizacao, observacao } = req.body;
    const rastreamento = await Rastreamento.findById(req.params.rastreamentoId);
    
    if (!rastreamento) {
      return res.status(404).json({ success: false, message: 'Rastreamento não encontrado' });
    }
    
    rastreamento.historico.push({ ...localizacao, etapa, observacao });
    rastreamento.localizacaoAtual = localizacao;
    rastreamento.status = etapa;
    
    if (etapa === 'colheita') {
      rastreamento.dataColheita = new Date();
    }
    
    await rastreamento.save();
    res.json({ success: true, data: rastreamento });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Buscar rastreamento por produto
router.get('/produto/:produtoId', async (req, res) => {
  try {
    const rastreamento = await Rastreamento.findOne({ produtoId: req.params.produtoId })
      .populate('vendedorId', 'nome email');
    
    if (!rastreamento) {
      return res.json({ success: true, data: null, message: 'Produto não rastreado' });
    }
    
    res.json({ success: true, data: rastreamento });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mapa de produtores próximos
router.get('/produtores-proximos', async (req, res) => {
  try {
    const { lat, lng, raioKm = 50 } = req.query;
    
    // Buscar todos os rastreamentos ativos
    const rastreamentos = await Rastreamento.find({ status: { $ne: 'entregue' } })
      .populate('vendedorId', 'nome email')
      .populate('produtoId', 'nome preco');
    
    // Calcular distância (filtro simples - em produção use geospatial index)
    const produtoresProximos = rastreamentos.filter(r => {
      if (!r.localizacaoAtual.lat || !r.localizacaoAtual.lng) return false;
      const distance = Math.sqrt(
        Math.pow(r.localizacaoAtual.lat - lat, 2) + 
        Math.pow(r.localizacaoAtual.lng - lng, 2)
      ) * 111; // conversão aproximada para km
      return distance <= raioKm;
    });
    
    res.json({ success: true, data: produtoresProximos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;