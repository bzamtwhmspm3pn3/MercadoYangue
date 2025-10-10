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
  const { remetente, destinatario, conteudo, imagem, arquivo, arquivoNome, arquivoTipo } = req.body;

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

    const conteudoArquivo = imagem || arquivo || null;

    const novaMsg = await Mensagem.create({
      remetente: remetenteId,
      destinatario: destinatarioId,
      conteudo,
      arquivo: conteudoArquivo,
      arquivoNome,
      arquivoTipo,
      tipo: tipoMsg
    });

    const msgPopulada = await Mensagem.findById(novaMsg._id)
      .populate("remetente", "nome email")
      .populate("destinatario", "nome email");

    // 🔥 Pega o io do app
    const io = req.app.get("io");

    // 🔥 Envia a mensagem em tempo real pros dois (como WhatsApp)
    io.emit("receivemessage", msgPopulada);

    // Retorna também pela rota normal
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
      .lean();

    res.json(mensagens);
  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    res.status(500).json({ erro: "Erro ao buscar histórico" });
  }
});

// GET /api/chat/conversas/:usuarioId
router.get("/conversas/:usuarioId", async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const uId = await resolveUsuarioId(usuarioId);
    if (!uId) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    // Busca todas as mensagens onde o usuário é remetente ou destinatário
    const mensagens = await Mensagem.find({
      $or: [{ remetente: uId }, { destinatario: uId }]
    })
      .sort({ data: -1 })
      .populate("remetente", "nome email")
      .populate("destinatario", "nome email")
      .lean();

    // Agrupa por usuário (tipo lista de conversas)
    const conversas = {};
    mensagens.forEach(msg => {
      const outro = msg.remetente._id.toString() === uId.toString()
        ? msg.destinatario
        : msg.remetente;

      if (!conversas[outro._id]) {
        conversas[outro._id] = {
          usuario: outro,
          ultimaMensagem: msg.conteudo || msg.arquivoNome || "(Arquivo enviado)",
          data: msg.data,
          tipo: msg.tipo
        };
      }
    });

    res.json(Object.values(conversas));
  } catch (err) {
    console.error("Erro ao buscar conversas:", err);
    res.status(500).json({ erro: "Erro ao buscar conversas" });
  }
});


module.exports = router;
