const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const Produto = require('../models/produto');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Multer salva temporariamente na pasta 'temp'
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'temp/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// POST - Cadastrar produto com Cloudinary
router.post('/', authMiddleware, upload.single('imagem'), async (req, res) => {
  try {
    const {
      nome,
      preco,
      quantidade,
      unidade,
      provincia,
      municipio,
      localizacaoDetalhada,
      contactos,
      descricao,
    } = req.body;

    // Forma de pagamento
    let formaPagamento = req.body.formaPagamento;
    if (typeof formaPagamento === 'string') {
      try {
        formaPagamento = JSON.parse(formaPagamento);
      } catch (e) {
        return res.status(400).json({ msg: 'Forma de pagamento inválida (JSON).' });
      }
    }

    if (!nome || !preco || !quantidade || !formaPagamento?.tipo) {
      return res.status(400).json({ msg: 'Campos obrigatórios faltando.' });
    }

    // Upload para Cloudinary
    let imagemUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `produtos/${req.user.id}`,
      });
      imagemUrl = result.secure_url;
      fs.unlinkSync(req.file.path); // remove temporário
    }

    const novoProduto = new Produto({
      nome,
      preco,
      quantidade,
      unidade,
      imagem: imagemUrl,
      provincia,
      municipio,
      localizacaoEspecifica: localizacaoDetalhada,
      contactos,
      formaPagamento,
      descricao,
      vendedor: req.user.id,
    });

    await novoProduto.save();
    res.status(201).json({ msg: 'Produto cadastrado com sucesso!', produto: novoProduto });
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ msg: 'Erro ao cadastrar produto' });
  }
});

// GET - Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const produtos = await Produto.find().populate('vendedor', 'nome contacto formaPagamento');
    res.json(produtos);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ msg: 'Erro ao buscar produtos' });
  }
});

// GET - Produtos do vendedor autenticado
router.get('/meus-produtos', authMiddleware, async (req, res) => {
  try {
    const produtos = await Produto.find({ vendedor: req.user.id })
      .populate('vendedor', 'nome contacto formaPagamento');
    res.json(produtos);
  } catch (err) {
    console.error('Erro ao buscar produtos do vendedor:', err);
    res.status(500).json({ msg: 'Erro ao buscar produtos do vendedor' });
  }
});

// DELETE - Excluir produto
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ msg: 'Produto não encontrado' });

    if (produto.vendedor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Você não tem permissão para excluir este produto' });
    }

    await Produto.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ msg: 'Erro ao excluir produto' });
  }
});

// PUT - Atualizar quantidade, preço ou imagem
router.put('/:id', authMiddleware, upload.single('imagem'), async (req, res) => {
  try {
    const { quantidade, preco } = req.body;
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ msg: 'Produto não encontrado' });

    if (produto.vendedor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Você não tem permissão para editar este produto' });
    }

    if (quantidade !== undefined) produto.quantidade = quantidade;
    if (preco !== undefined) produto.preco = preco;

    // Se enviar nova imagem
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `produtos/${req.user.id}`,
      });
      produto.imagem = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    await produto.save();
    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ msg: 'Erro ao atualizar produto' });
  }
});

module.exports = router;
