const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const Usuario = require('../models/usuario'); // seu modelo Usuario.js

// Rota de registro
router.post('/cadastro', async (req, res) => {
  let {
    nome,
    email,
    senha,
    tipo,
    provincia,
    municipio,
    localizacaoEspecifica,
    formaPagamento,  // deixa, mas não será validado
    aceitouContrato,
  } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ msg: 'Nome, email, senha e tipo são obrigatórios.' });
  }

  try {
    // Verifica se email já existe
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ msg: 'Email já registrado.' });

    // Hash da senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Ajusta campos para cliente
    if (tipo === 'cliente') {
      formaPagamento = undefined;
      provincia = undefined;
      municipio = undefined;
      localizacaoEspecifica = undefined;
      aceitouContrato = undefined; // clientes não precisam aceitar contrato
    } else {
      // Remove obrigatoriedade formaPagamento para vendedor/agricultor
      // Apenas valida o aceite do contrato
      if (!aceitouContrato) {
        return res.status(400).json({ msg: 'Aceite do contrato é obrigatório para vendedores/agricultores.' });
      }
    }

    // Log para debug (não logar senha real)
    console.log({
      nome,
      email,
      senha: '***',
      tipo,
      provincia,
      municipio,
      localizacaoEspecifica,
      formaPagamento,
      aceitouContrato,
    });

    // Cria usuário novo
    const novoUsuario = new Usuario({
      nome,
      email,
      senha: hashedSenha,
      tipo,
      provincia,
      municipio,
      localizacaoEspecifica,
      formaPagamento,
      aceitouContrato,
    });

    // Validação antes de salvar
    const erroValidacao = novoUsuario.validateSync();
    if (erroValidacao) {
      console.error('Erro de validação completo:', erroValidacao.errors);
      return res.status(400).json({ msg: 'Erro de validação', detalhes: erroValidacao.errors });
    }

    await novoUsuario.save();

    res.status(201).json({ msg: 'Usuário registrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(401).json({ msg: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ msg: 'Senha incorreta' });

    const payload = {
      id: usuario._id,
      nome: usuario.nome,
      tipo: usuario.tipo,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, usuario: payload });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

module.exports = router;
