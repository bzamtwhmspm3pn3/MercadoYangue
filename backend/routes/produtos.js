const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const Produto = require('../models/produto');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// POST - Cadastrar produto
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

    const imagem = req.file ? req.file.filename : null;

    // Trata o campo formaPagamento (que vem como string JSON do frontend)
    let formaPagamento = req.body.formaPagamento;
    if (typeof formaPagamento === 'string') {
      try {
        formaPagamento = JSON.parse(formaPagamento);
      } catch (e) {
        return res.status(400).json({ msg: 'Forma de pagamento inválida (JSON).' });
      }
    }

    // Validação básica
    if (!nome || !preco || !quantidade || !imagem || !formaPagamento?.tipo) {
      return res.status(400).json({ msg: 'Campos obrigatórios faltando.' });
    }

    // Cria novo produto
    const novoProduto = new Produto({
      nome,
      preco,
      quantidade,
      unidade,
      imagem,
      provincia,
      municipio,
      localizacaoEspecifica: localizacaoDetalhada,
      contactos,
      formaPagamento,
      descricao,
      vendedor: req.user.id,
    });


    await novoProduto.save();
    res.status(201).json({ msg: 'Produto cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ msg: 'Erro ao cadastrar produto' });
  }
});

// GET - Listar todos os produtos com dados do vendedor
router.get('/', async (req, res) => {
  try {
    const produtos = await Produto.find()
      .populate('vendedor', 'nome contacto formaPagamento');
    res.json(produtos);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ msg: 'Erro ao buscar produtos' });
  }
});

// GET - Listar produtos do vendedor autenticado
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

// DELETE - Excluir produto por ID
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);

    if (!produto) {
      return res.status(404).json({ msg: 'Produto não encontrado' });
    }

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

// PUT - Atualizar quantidade e/ou preço
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { quantidade, preco } = req.body;

    const produto = await Produto.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ msg: 'Produto não encontrado' });
    }

    if (produto.vendedor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Você não tem permissão para editar este produto' });
    }

    if (quantidade !== undefined) produto.quantidade = quantidade;
    if (preco !== undefined) produto.preco = preco;

    await produto.save();

    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ msg: 'Erro ao atualizar produto' });
  }
});

module.exports = router;

