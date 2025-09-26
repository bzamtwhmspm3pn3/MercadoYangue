const express = require('express');
const router = express.router();
const { authmiddleware } = require('../middlewares/auth');
const produto = require('../models/produto');
const multer = require('multer');

const storage = multer.diskstorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// post - cadastrar produto
router.post('/', authmiddleware, upload.single('imagem'), async (req, res) => {
  try {
    const {
      nome,
      preco,
      quantidade,
      unidade,
      provincia,
      municipio,
      localizacaodetalhada,
      contactos,
      descricao,
    } = req.body;

    const imagem = req.file ? req.file.filename : null;

    // trata o campo formapagamento (que vem como string json do frontend)
    let formapagamento = req.body.formapagamento;
    if (typeof formapagamento === 'string') {
      try {
        formapagamento = json.parse(formapagamento);
      } catch (e) {
        return res.status(400).json({ msg: 'forma de pagamento inválida (json).' });
      }
    }

    // validação básica
    if (!nome || !preco || !quantidade || !imagem || !formapagamento?.tipo) {
      return res.status(400).json({ msg: 'campos obrigatórios faltando.' });
    }

    // cria novo produto
    const novoproduto = new produto({
      nome,
      preco,
      quantidade,
      unidade,
      imagem,
      provincia,
      municipio,
      localizacaoespecifica: localizacaodetalhada,
      contactos,
      formapagamento,
      descricao,
      vendedor: req.user.id,
    });

    await novoproduto.save();
    res.status(201).json({ msg: 'produto cadastrado com sucesso!' });
  } catch (error) {
    console.error('erro ao cadastrar produto:', error);
    res.status(500).json({ msg: 'erro ao cadastrar produto' });
  }
});

// get - listar todos os produtos com dados do vendedor
router.get('/', async (req, res) => {
  try {
    const produtos = await produto.find()
      .populate('vendedor', 'nome contacto formapagamento');
    res.json(produtos);
  } catch (err) {
    console.error('erro ao buscar produtos:', err);
    res.status(500).json({ msg: 'erro ao buscar produtos' });
  }
});

// get - listar produtos do vendedor autenticado
router.get('/meus-produtos', authmiddleware, async (req, res) => {
  try {
    const produtos = await produto.find({ vendedor: req.user.id })
      .populate('vendedor', 'nome contacto formapagamento');
    res.json(produtos);
  } catch (err) {
    console.error('erro ao buscar produtos do vendedor:', err);
    res.status(500).json({ msg: 'erro ao buscar produtos do vendedor' });
  }
});

// delete - excluir produto por id
router.delete('/:id', authmiddleware, async (req, res) => {
  try {
    const produto = await produto.findbyid(req.params.id);

    if (!produto) {
      return res.status(404).json({ msg: 'produto não encontrado' });
    }

    if (produto.vendedor.tostring() !== req.user.id) {
      return res.status(403).json({ msg: 'você não tem permissão para excluir este produto' });
    }

    await produto.findbyidanddelete(req.params.id);
    res.json({ msg: 'produto excluído com sucesso' });
  } catch (error) {
    console.error('erro ao excluir produto:', error);
    res.status(500).json({ msg: 'erro ao excluir produto' });
  }
});

// put - atualizar quantidade e/ou preço
router.put('/:id', authmiddleware, async (req, res) => {
  try {
    const { quantidade, preco } = req.body;

    const produto = await produto.findbyid(req.params.id);
    if (!produto) {
      return res.status(404).json({ msg: 'produto não encontrado' });
    }

    if (produto.vendedor.tostring() !== req.user.id) {
      return res.status(403).json({ msg: 'você não tem permissão para editar este produto' });
    }

    if (quantidade !== undefined) produto.quantidade = quantidade;
    if (preco !== undefined) produto.preco = preco;

    await produto.save();

    res.json(produto);
  } catch (error) {
    console.error('erro ao atualizar produto:', error);
    res.status(500).json({ msg: 'erro ao atualizar produto' });
  }
});

module.exports = router;

