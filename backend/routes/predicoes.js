// routes/predicoes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Schema para armazenar previsões
const PrevisaoSchema = new mongoose.Schema({
  produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto' },
  provincia: String,
  dataPrevisao: { type: Date, default: Date.now },
  periodo: String, // 'semanal', 'mensal', 'sazonal'
  demandaEstimada: Number,
  precoEstimado: Number,
  confianca: Number, // 0-100%
  fatoresConsiderados: [String],
  createdAt: { type: Date, default: Date.now }
});

const Previsao = mongoose.model('Previsao', PrevisaoSchema);

// Gerar previsão automática baseada em dados históricos
router.post('/gerar', async (req, res) => {
  try {
    const { produtoId, provincia, periodo } = req.body;
    
    // Buscar dados históricos de vendas
    const Venda = mongoose.model('Venda');
    const vendas = await Venda.aggregate([
      { $match: { 
        ...(produtoId && { produtoId: mongoose.Types.ObjectId(produtoId) }),
        ...(provincia && { 'comprador.provincia': provincia }),
        data: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      }},
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$data" } },
        totalVendas: { $sum: "$quantidade" },
        receita: { $sum: "$valorTotal" }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    if (vendas.length < 7) {
      return res.json({ 
        success: false, 
        message: "Dados insuficientes para previsão (mínimo 7 dias de histórico)" 
      });
    }
    
    // Cálculo simples de previsão (média móvel)
    const valores = vendas.map(v => v.totalVendas);
    const mediaMovel = valores.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const tendencia = valores.length > 14 ? 
      (valores.slice(-7).reduce((a, b) => a + b, 0) - valores.slice(-14, -7).reduce((a, b) => a + b, 0)) / 7 : 0;
    
    const demandaEstimada = Math.max(0, Math.round(mediaMovel + tendencia));
    
    // Estimar preço baseado em tendência
    const precos = vendas.map(v => v.receita / v.totalVendas);
    const precoMedio = precos.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const precoEstimado = parseFloat((precoMedio * (1 + tendencia / mediaMovel * 0.1)).toFixed(2));
    
    // Calcular confiança (baseado na consistência dos dados)
    const desvioPadrao = Math.sqrt(valores.map(v => Math.pow(v - mediaMovel, 2)).reduce((a, b) => a + b, 0) / valores.length);
    const confianca = Math.max(0, Math.min(100, Math.round(100 - (desvioPadrao / mediaMovel * 100))));
    
    const previsao = new Previsao({
      produtoId,
      provincia,
      periodo: periodo || 'semanal',
      demandaEstimada,
      precoEstimado,
      confianca,
      fatoresConsiderados: ['histórico_vendas_90dias', 'tendencia_sazonal', 'media_movel_7dias']
    });
    
    await previsao.save();
    
    res.json({ 
      success: true, 
      data: previsao,
      analise: {
        mediaVendasDiaria: mediaMovel,
        tendencia: tendencia > 0 ? 'crescimento' : tendencia < 0 ? 'queda' : 'estável',
        variacaoPercentual: ((tendencia / mediaMovel) * 100).toFixed(1)
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar previsão:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Buscar previsões por produto
router.get('/produto/:produtoId', async (req, res) => {
  try {
    const previsoes = await Previsao.find({ produtoId: req.params.produtoId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, data: previsoes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dashboard de previsões gerais
router.get('/dashboard', async (req, res) => {
  try {
    // Top produtos com maior demanda prevista
    const topProdutos = await Previsao.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$produtoId', ultimaPrevisao: { $first: '$$ROOT' } } },
      { $sort: { 'ultimaPrevisao.demandaEstimada': -1 } },
      { $limit: 10 }
    ]);
    
    // Média de confiança das previsões
    const mediaConfianca = await Previsao.aggregate([
      { $group: { _id: null, media: { $avg: '$confianca' } } }
    ]);
    
    res.json({ 
      success: true, 
      data: {
        topProdutos,
        confiancaMedia: mediaConfianca[0]?.media || 0,
        totalPrevisoes: await Previsao.countDocuments()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;