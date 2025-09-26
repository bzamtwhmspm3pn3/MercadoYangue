const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.router();
const usuario = require('../models/usuario'); // seu modelo usuario.js

// rota de registro
router.post('/cadastro', async (req, res) => {
  let {
    nome,
    email,
    senha,
    tipo,
    provincia,
    municipio,
    localizacaoespecifica,
    formapagamento,  // deixa, mas não será validado
    aceitoucontrato,
  } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ msg: 'nome, email, senha e tipo são obrigatórios.' });
  }

  try {
    // verifica se email já existe
    const existe = await usuario.findone({ email });
    if (existe) return res.status(400).json({ msg: 'email já registrado.' });

    // hash da senha
    const hashedsenha = await bcrypt.hash(senha, 10);

    // ajusta campos para cliente
    if (tipo === 'cliente') {
      formapagamento = undefined;
      provincia = undefined;
      municipio = undefined;
      localizacaoespecifica = undefined;
      aceitoucontrato = undefined; // clientes não precisam aceitar contrato
    } else {
      // remove obrigatoriedade formapagamento para vendedor/agricultor
      // apenas valida o aceite do contrato
      if (!aceitoucontrato) {
        return res.status(400).json({ msg: 'aceite do contrato é obrigatório para vendedores/agricultores.' });
      }
    }

    // log para debug (não logar senha real)
    console.log({
      nome,
      email,
      senha: '***',
      tipo,
      provincia,
      municipio,
      localizacaoespecifica,
      formapagamento,
      aceitoucontrato,
    });

    // cria usuário novo
    const novousuario = new usuario({
      nome,
      email,
      senha: hashedsenha,
      tipo,
      provincia,
      municipio,
      localizacaoespecifica,
      formapagamento,
      aceitoucontrato,
    });

    // validação antes de salvar
    const errovalidacao = novousuario.validatesync();
    if (errovalidacao) {
      console.error('erro de validação completo:', errovalidacao.errors);
      return res.status(400).json({ msg: 'erro de validação', detalhes: errovalidacao.errors });
    }

    await novousuario.save();

    res.status(201).json({ msg: 'usuário registrado com sucesso!' });
  } catch (err) {
    console.error('erro ao registrar usuário:', err);
    res.status(500).json({ msg: 'erro no servidor' });
  }
});

// rota de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await usuario.findone({ email });
    if (!usuario) return res.status(401).json({ msg: 'usuário não encontrado' });

    const senhavalida = await bcrypt.compare(senha, usuario.senha);
    if (!senhavalida) return res.status(401).json({ msg: 'senha incorreta' });

    const payload = {
      id: usuario._id,
      nome: usuario.nome,
      tipo: usuario.tipo,
    };

    const token = jwt.sign(payload, process.env.jwt_secret, { expiresin: '1h' });

    res.json({ token, usuario: payload });
  } catch (err) {
    console.error('erro no login:', err);
    res.status(500).json({ msg: 'erro no servidor' });
  }
});

module.exports = router;
