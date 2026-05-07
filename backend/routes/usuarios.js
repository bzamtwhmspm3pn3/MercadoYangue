const express = require('express');
const router = express.Router();
const Produto = require('../models/produto');
const Usuario = require('../models/usuario');
const Venda = require('../models/venda');
const Entrega = require('../models/entrega');

// ============ ROTA PÚBLICA ============

// Buscar vendedores por nome do produto
router.get('/buscar-vendedores', async (req, res) => {
  try {
    const { nomeProduto } = req.query;
    if (!nomeProduto) {
      return res.status(400).json({ success: false, msg: 'Parâmetro nomeProduto é obrigatório' });
    }

    const produtos = await Produto.find({
      nome: { $regex: nomeProduto, $options: 'i' },
      quantidade: { $gt: 0 },
    }).populate('vendedor', 'nome tipo telefone email provincia municipio localizacaoEspecifica');

    const vendedoresMap = new Map();
    produtos.forEach((produto) => {
      if (produto.vendedor) {
        if (!vendedoresMap.has(produto.vendedor._id.toString())) {
          vendedoresMap.set(produto.vendedor._id.toString(), {
            ...produto.vendedor.toObject(),
            produtos: []
          });
        }
        vendedoresMap.get(produto.vendedor._id.toString()).produtos.push({
          id: produto._id,
          nome: produto.nome,
          preco: produto.preco,
          unidade: produto.unidade
        });
      }
    });

    const vendedores = Array.from(vendedoresMap.values());

    res.json({ success: true, data: vendedores, total: vendedores.length });
  } catch (error) {
    console.error('Erro buscar vendedores:', error);
    res.status(500).json({ success: false, msg: 'Erro interno no servidor' });
  }
});

// Listar vendedores ativos (vendedores e agricultores)
router.get('/listar-vendedores', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vendedores = await Usuario.find({ 
      tipo: { $in: ['vendedor', 'agricultor'] },
      aceitouContrato: true 
    }).select('-senha')
      .skip(skip)
      .limit(parseInt(limit));

    // Buscar estatísticas para cada vendedor
    const vendedoresIds = vendedores.map(v => v._id);
    
    const vendasStats = await Venda.aggregate([
      { $match: { vendedorId: { $in: vendedoresIds } } },
      { $group: {
        _id: '$vendedorId',
        totalVendas: { $sum: 1 },
        receitaTotal: { $sum: '$total' },
        avaliacaoMedia: { $avg: '$avaliacao' }
      }}
    ]);

    const produtosCount = await Produto.aggregate([
      { $match: { vendedorId: { $in: vendedoresIds } } },
      { $group: {
        _id: '$vendedorId',
        totalProdutos: { $sum: 1 }
      }}
    ]);

    const vendedoresComDados = vendedores.map(vendedor => {
      const vendas = vendasStats.find(v => v._id.toString() === vendedor._id.toString()) || {};
      const produtos = produtosCount.find(p => p._id.toString() === vendedor._id.toString()) || {};
      return {
        ...vendedor.toObject(),
        totalVendas: vendas.totalVendas || 0,
        receitaTotal: vendas.receitaTotal || 0,
        avaliacaoMedia: (vendas.avaliacaoMedia || 0).toFixed(1),
        totalProdutos: produtos.totalProdutos || 0
      };
    });

    const total = await Usuario.countDocuments({ 
      tipo: { $in: ['vendedor', 'agricultor'] },
      aceitouContrato: true 
    });

    res.json({ 
      success: true, 
      data: vendedoresComDados,
      paginacao: {
        pagina: parseInt(page),
        limite: parseInt(limit),
        total,
        paginas: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro listar vendedores:', error);
    res.status(500).json({ success: false, msg: 'Erro interno no servidor' });
  }
});

// Listar entregadores ativos
router.get('/listar-entregadores', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const entregadores = await Usuario.find({ 
      tipo: 'entregador',
      disponivel: true 
    }).select('-senha')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Usuario.countDocuments({ tipo: 'entregador', disponivel: true });

    res.json({ 
      success: true, 
      data: entregadores,
      paginacao: {
        pagina: parseInt(page),
        limite: parseInt(limit),
        total,
        paginas: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro listar entregadores:', error);
    res.status(500).json({ success: false, msg: 'Erro interno no servidor' });
  }
});

// Listar clientes (apenas admin)
router.get('/listar-clientes', async (req, res) => {
  try {
    const { token } = req.headers;
    // TODO: Verificar se é admin
    // const usuario = await Usuario.findOne({ token });
    // if (usuario.tipo !== 'admin') return res.status(403).json({ success: false, msg: 'Acesso negado' });

    const clientes = await Usuario.find({ tipo: 'cliente' }).select('-senha');
    
    res.json({ success: true, data: clientes });
  } catch (error) {
    console.error('Erro listar clientes:', error);
    res.status(500).json({ success: false, msg: 'Erro interno no servidor' });
  }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-senha');
    
    if (!usuario) {
      return res.status(404).json({ success: false, msg: 'Usuário não encontrado' });
    }
    
    // Buscar estatísticas adicionais para vendedores
    let estatisticas = {};
    if (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor') {
      const produtos = await Produto.find({ vendedorId: usuario._id });
      const vendas = await Venda.find({ vendedorId: usuario._id });
      
      estatisticas = {
        totalProdutos: produtos.length,
        produtosAtivos: produtos.filter(p => p.quantidade > 0).length,
        totalVendas: vendas.length,
        receitaTotal: vendas.reduce((sum, v) => sum + (v.total || 0), 0),
        avaliacaoMedia: vendas.length > 0 ? (vendas.reduce((sum, v) => sum + (v.avaliacao || 0), 0) / vendas.length).toFixed(1) : 0
      };
    }
    
    res.json({ 
      success: true, 
      data: { ...usuario.toObject(), estatisticas }
    });
  } catch (error) {
    console.error('Erro buscar usuário:', error);
    res.status(500).json({ success: false, msg: 'Erro interno no servidor' });
  }
});

module.exports = router;