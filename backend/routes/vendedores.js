const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario');
const Venda = require('../models/venda');

// Solicitar selo de vendedor verificado
router.post('/solicitar-selo', async (req, res) => {
  try {
    const { vendedorId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!vendedorId) {
      return res.status(400).json({ success: false, msg: "vendedorId é obrigatório" });
    }

    // Verificar se o vendedor existe
    const vendedor = await Usuario.findById(vendedorId);
    if (!vendedor) {
      return res.status(404).json({ success: false, msg: "Vendedor não encontrado" });
    }

    if (vendedor.tipo !== 'vendedor' && vendedor.tipo !== 'agricultor') {
      return res.status(400).json({ success: false, msg: "Usuário não é vendedor" });
    }

    // Verificar critérios para selo
    const vendas = await Venda.find({ vendedorId: vendedorId });
    const totalVendas = vendas.length;
    const avaliacaoMedia = vendas.length > 0 
      ? vendas.reduce((sum, v) => sum + (v.avaliacao || 0), 0) / vendas.length 
      : 0;

    let elegivel = false;
    let mensagem = "";

    if (totalVendas >= 10 && avaliacaoMedia >= 4) {
      elegivel = true;
      mensagem = "Parabéns! Você é elegível para o selo de vendedor verificado.";
    } else if (totalVendas >= 5) {
      mensagem = `Você tem ${totalVendas} vendas. Precisa de pelo menos 10 vendas e avaliação média ≥ 4 estrelas.`;
    } else {
      mensagem = `Você precisa de pelo menos 10 vendas para solicitar o selo. Atualmente: ${totalVendas} vendas.`;
    }

    console.log(`Selo solicitado para vendedor: ${vendedor.nome} (${vendedorId})`);

    res.json({ 
      success: true, 
      elegivel,
      msg: mensagem,
      estatisticas: {
        totalVendas,
        avaliacaoMedia: avaliacaoMedia.toFixed(1),
        metaVendas: 10,
        metaAvaliacao: 4
      }
    });
  } catch (error) {
    console.error('Erro ao solicitar selo:', error);
    res.status(500).json({ success: false, msg: 'Erro interno no servidor' });
  }
});

// Buscar negociações do vendedor (pendentes)
router.get('/negociacoes/:vendedorId', async (req, res) => {
  try {
    const { vendedorId } = req.params;
    
    // TODO: Implementar busca de negociações
    const negociacoes = []; // Placeholder
    
    res.json({ success: true, data: negociacoes });
  } catch (error) {
    console.error('Erro buscar negociações:', error);
    res.status(500).json({ success: false, msg: 'Erro interno no servidor' });
  }
});

// Atualizar disponibilidade do vendedor
router.put('/disponibilidade/:vendedorId', async (req, res) => {
  try {
    const { vendedorId } = req.params;
    const { disponivel } = req.body;
    
    const vendedor = await Usuario.findByIdAndUpdate(
      vendedorId,
      { disponivel },
      { new: true }
    ).select('-senha');
    
    res.json({ 
      success: true, 
      data: vendedor,
      msg: disponivel ? "Vendedor ativado" : "Vendedor desativado"
    });
  } catch (error) {
    console.error('Erro atualizar disponibilidade:', error);
    res.status(500).json({ success: false, msg: 'Erro interno no servidor' });
  }
});

// Buscar produtos mais vendidos do vendedor
router.get('/top-produtos/:vendedorId', async (req, res) => {
  try {
    const { vendedorId } = req.params;
    const { limit = 5 } = req.query;
    
    const vendas = await Venda.find({ vendedorId })
      .populate('itens.produtoId')
      .limit(parseInt(limit) * 2); // Margem para cálculo
    
    // Agrupar produtos
    const produtosMap = new Map();
    vendas.forEach(venda => {
      venda.itens.forEach(item => {
        if (item.produtoId) {
          const id = item.produtoId._id.toString();
          if (!produtosMap.has(id)) {
            produtosMap.set(id, {
              id,
              nome: item.produtoId.nome,
              quantidade: 0,
              receita: 0
            });
          }
          const prod = produtosMap.get(id);
          prod.quantidade += item.quantidade;
          prod.receita += item.valorTotal;
        }
      });
    });
    
    const topProdutos = Array.from(produtosMap.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, parseInt(limit));
    
    res.json({ success: true, data: topProdutos });
  } catch (error) {
    console.error('Erro buscar top produtos:', error);
    res.status(500).json({ success: false, msg: 'Erro interno no servidor' });
  }
});

module.exports = router;
