const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const Usuario = require('../models/usuario');

// ==========================
// Função auxiliar: cria transporte de e-mail
// ==========================
function criarTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_HOST || !process.env.EMAIL_PORT) {
    console.warn('⚠️ Configuração de e-mail ausente. EMAIL_USER, EMAIL_PASS, EMAIL_HOST e EMAIL_PORT são obrigatórios.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// ==========================
// Middleware de autenticação
// ==========================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.id, nome: decoded.nome, tipo: decoded.tipo };
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token inválido' });
  }
}

// ==========================
// Cadastro de usuário
// ==========================
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, tipo, provincia, municipio, localizacaoEspecifica, formaPagamento, aceitouContrato } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ msg: 'Nome, email, senha e tipo são obrigatórios.' });
  }

  try {
    if (await Usuario.findOne({ email })) {
      return res.status(400).json({ msg: 'Email já registrado.' });
    }

    const hashedSenha = await bcrypt.hash(senha, 10);
    const dadosUsuario = { nome, email, senha: hashedSenha, tipo };

    if (tipo !== 'cliente') {
      if (!aceitouContrato) {
        return res.status(400).json({ msg: 'Aceite do contrato é obrigatório para vendedores/agricultores.' });
      }
      Object.assign(dadosUsuario, { provincia, municipio, localizacaoEspecifica, formaPagamento, aceitouContrato });
    }

    const novoUsuario = new Usuario(dadosUsuario);

    const erroValidacao = novoUsuario.validateSync();
    if (erroValidacao) {
      return res.status(400).json({ msg: 'Erro de validação', detalhes: erroValidacao.errors });
    }

    await novoUsuario.save();

    res.status(201).json({ msg: 'Usuário registrado com sucesso!' });
  } catch (err) {
    console.error('❌ Erro ao registrar usuário:', err);
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
    console.error('❌ Erro no login:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// ==========================
// Solicitar selo de confiança
// ==========================
router.post('/solicitar-selo', authMiddleware, async (req, res) => {
  try {
    const vendedor = await Usuario.findById(req.user._id);

    if (!vendedor || !['vendedor', 'agricultor'].includes(vendedor.tipo)) {
      return res.status(404).json({ msg: "Usuário inválido para solicitar selo" });
    }

    if (vendedor.seloSolicitado) {
      return res.status(400).json({ msg: "Selo já solicitado" });
    }

    vendedor.seloSolicitado = true;
    await vendedor.save();

    return res.status(200).json({ msg: "Selo solicitado com sucesso!" });
  } catch (err) {
    console.error("Erro ao solicitar selo:", err);
    return res.status(500).json({ msg: "Erro interno" });
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
    usuario.senhaResetToken = token;
    usuario.senhaResetExp = Date.now() + 3600 * 1000; // 1 hora
    await usuario.save();

    const transporter = criarTransporter();

    if (transporter) {
      const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}&email=${email}`;
      await transporter.sendMail({
        from: `"MercadoYangue" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Redefinição de senha",
        html: `
          <p>Você solicitou a redefinição de senha.</p>
          <p>Clique no link abaixo para criar uma nova senha (válido por 1h):</p>
          <a href="${link}">${link}</a>
        `,
      });
      return res.json({ msg: 'Email de redefinição enviado com sucesso.' });
    } else {
      console.warn('⚠️ Email não configurado — token retornado apenas para teste.');
      return res.json({ msg: 'Token gerado, mas email não enviado.', token });
    }
  } catch (err) {
    console.error('❌ Erro ao processar redefinição de senha:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// ==========================
// Redefinir senha
// ==========================
router.post('/redefinir-senha', async (req, res) => {
  const { email, token, novaSenha } = req.body;
  if (!email || !token || !novaSenha) {
    return res.status(400).json({ msg: 'Todos os campos são obrigatórios.' });
  }

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
    console.error('❌ Erro ao redefinir senha:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// ==========================
// Enviar email de confirmação pós-cadastro
// ==========================
router.post('/enviar-confirmacao', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Email é obrigatório.' });

  try {
    const transporter = criarTransporter();

    if (!transporter) {
      return res.status(500).json({ msg: 'Serviço de email não configurado.' });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Confirmação de cadastro",
      html: `
        <p>Bem-vindo(a) ao <b>Mercado Yangue</b>!</p>
        <p>Seu cadastro foi concluído com sucesso.</p>
        <p>Agora você pode fazer login e começar a usar a plataforma.</p>
      `,
    });

    res.json({ msg: 'Email de confirmação enviado.' });
  } catch (err) {
    console.error('❌ Erro ao enviar email de confirmação:', err);
    res.status(500).json({ msg: 'Falha ao enviar email.' });
  }
});

module.exports = router;


