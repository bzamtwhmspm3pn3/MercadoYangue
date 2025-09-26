const express = require("express");
const router = express.Router();
const Mensagem = require("../models/mensagem");
const Usuario = require("../models/usuario");
const mongoose = require("mongoose");

// Resolve _id de usuário por nome ou ID
async function resolveUsuarioId(input) {
  if (!input) return null;

  if (mongoose.Types.ObjectId.isValid(input)) {
    const usuario = await Usuario.findById(input);
    if (usuario) return usuario._id;
  }

  const usuario = await Usuario.findOne({ nome: input });
  if (usuario) return usuario._id;

  return null;
}

// POST /api/chat/enviar
router.post("/enviar", async (req, res) => {
  const { remetente, destinatario, conteudo, arquivo, arquivoNome, arquivoTipo } = req.body;

  if (!remetente || !destinatario || (!conteudo && !arquivo)) {
    return res.status(400).json({ erro: "Dados insuficientes" });
  }

  try {
    const remetenteId = await resolveUsuarioId(remetente);
    const destinatarioId = await resolveUsuarioId(destinatario);

    if (!remetenteId || !destinatarioId) {
      return res.status(404).json({ erro: "Remetente ou destinatário não encontrados" });
    }

    const tipoMsg = arquivo
  ? (arquivoTipo?.startsWith("image/") ? "imagem" : "arquivo")
  : "texto";


const novaMsg = await Mensagem.create({
  remetente: remetenteId,
  destinatario: destinatarioId,
  conteudo,
  arquivo,
  arquivoNome,
  arquivoTipo,
  tipo: tipoMsg
});


    const msgPopulada = await Mensagem.findById(novaMsg._id)
      .populate("remetente", "nome email")
      .populate("destinatario", "nome email");

    res.json({ success: true, mensagem: msgPopulada });
  } catch (err) {
    console.error("Erro ao salvar mensagem:", err);
    res.status(500).json({ erro: "Erro ao salvar mensagem" });
  }
});

// GET /api/chat/historico/:usuario1/:usuario2
router.get("/historico/:usuario1/:usuario2", async (req, res) => {
  const { usuario1, usuario2 } = req.params;

  try {
    const u1Id = await resolveUsuarioId(usuario1);
    const u2Id = await resolveUsuarioId(usuario2);

    if (!u1Id || !u2Id) {
      return res.status(404).json({ erro: "Um ou ambos usuários não encontrados" });
    }

    const mensagens = await Mensagem.find({
  $or: [
    { remetente: u1Id, destinatario: u2Id },
    { remetente: u2Id, destinatario: u1Id }
  ]
})
.sort({ data: 1 })
.populate("remetente", "nome email")
.populate("destinatario", "nome email")
.lean(); // deixa como objeto JS simples para envio


    res.json(mensagens);
  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    res.status(500).json({ erro: "Erro ao buscar histórico" });
  }
});

module.exports = router;


