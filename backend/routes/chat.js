// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const Mensagem = require('../models/Mensagem'); // Modelo Mongoose

// Rota para enviar mensagem
router.post('/enviar', async (req, res) => {
  const { remetenteId, destinatarioId, mensagem, data } = req.body;

  try {
    const novaMensagem = new Mensagem({
      remetenteId,
      destinatarioId,
      mensagem,
      data: data || new Date()
    });

    await novaMensagem.save();
    res.status(201).json(novaMensagem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao enviar mensagem' });
  }
});

module.exports = router;
