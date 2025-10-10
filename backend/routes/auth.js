const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const Usuario = require('../models/usuario');

// ==========================
// Cadastro de usuário
// ==========================
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, tipo, provincia, municipio, localizacaoEspecifica, formaPagamento, aceitouContrato } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ msg: 'Nome, email, senha e tipo são obrigatórios.' });
  }

  try {
    if (await Usuario.findOne({ email })) return res.status(400).json({ msg: 'Email já registrado.' });

    const hashedSenha = await bcrypt.hash(senha, 10);
    const dadosUsuario = {
      nome,
      email,
      senha: hashedSenha,
      tipo,
    };

    if (tipo !== 'cliente') {
      if (!aceitouContrato) return res.status(400).json({ msg: 'Aceite do contrato é obrigatório para vendedores/agricultores.' });
      dadosUsuario.provincia = provincia;
      dadosUsuario.municipio = municipio;
      dadosUsuario.localizacaoEspecifica = localizacaoEspecifica;
      dadosUsuario.formaPagamento = formaPagamento;
      dadosUsuario.aceitouContrato = aceitouContrato;
    }

    const novoUsuario = new Usuario(dadosUsuario);

    const erroValidacao = novoUsuario.validateSync();
    if (erroValidacao) return res.status(400).json({ msg: 'Erro de validação', detalhes: erroValidacao.errors });

    await novoUsuario.save();
    res.status(201).json({ msg: 'Usuário registrado com sucesso!' });

  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// ==========================
// Login de usuário
// ==========================
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ msg: 'Email e senha são obrigatórios.' });

  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(401).json({ msg: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ msg: 'Senha incorreta' });

    const payload = { id: usuario._id, nome: usuario.nome, tipo: usuario.tipo };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, usuario: payload });

  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// ==========================
// Solicitar redefinição de senha
// ==========================
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Email é obrigatório.' });

  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(404).json({ msg: 'Usuário não encontrado.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiracao = Date.now() + 3600 * 1000; // 1 hora
    usuario.senhaResetToken = token;
    usuario.senhaResetExp = expiracao;
    await usuario.save();

    // Só tenta enviar email se variáveis existirem
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}&email=${email}`;
      await transporter.sendMail({
        from: `"MercadoYangue" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Redefinição de senha",
        html: `<p>Você solicitou redefinição de senha.</p>
               <p>Clique no link abaixo para criar uma nova senha (válido 1h):</p>
               <a href="${link}">${link}</a>`,
      });

      return res.json({ msg: 'Email de redefinição enviado com sucesso.' });
    } else {
      // Fallback Render: só retorna token no corpo (não envia email)
      console.warn('⚠️ Email não configurado, token retornado no corpo (apenas teste).');
      return res.json({ msg: 'Token gerado, mas email não enviado. Use o token abaixo para testes.', token });
    }

  } catch (err) {
    console.error('Erro ao processar redefinição de senha:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// ==========================
// Redefinir senha
// ==========================
router.post('/redefinir-senha', async (req, res) => {
  const { email, token, novaSenha } = req.body;
  if (!email || !token || !novaSenha) return res.status(400).json({ msg: 'Todos os campos são obrigatórios.' });

  try {
    const usuario = await Usuario.findOne({ email, senhaResetToken: token });
    if (!usuario) return res.status(400).json({ msg: 'Token inválido ou email incorreto.' });
    if (Date.now() > usuario.senhaResetExp) return res.status(400).json({ msg: 'Token expirado.' });

    usuario.senha = await bcrypt.hash(novaSenha, 10);
    usuario.senhaResetToken = undefined;
    usuario.senhaResetExp = undefined;
    await usuario.save();

    res.json({ msg: 'Senha redefinida com sucesso!' });

  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

module.exports = router;

