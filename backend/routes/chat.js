const express = require("express");
const router = express.router();
const mensagem = require("../models/mensagem");
const usuario = require("../models/usuario");
const mongoose = require("mongoose");

// resolve _id de usuário por nome ou id
async function resolveusuarioid(input) {
  if (!input) return null;

  if (mongoose.types.objectid.isvalid(input)) {
    const usuario = await usuario.findbyid(input);
    if (usuario) return usuario._id;
  }

  const usuario = await usuario.findone({ nome: input });
  if (usuario) return usuario._id;

  return null;
}

// post /api/chat/enviar
router.post("/enviar", async (req, res) => {
  const { remetente, destinatario, conteudo, arquivo, arquivonome, arquivotipo } = req.body;

  if (!remetente || !destinatario || (!conteudo && !arquivo)) {
    return res.status(400).json({ erro: "dados insuficientes" });
  }

  try {
    const remetenteid = await resolveusuarioid(remetente);
    const destinatarioid = await resolveusuarioid(destinatario);

    if (!remetenteid || !destinatarioid) {
      return res.status(404).json({ erro: "remetente ou destinatário não encontrados" });
    }

    const tipomsg = arquivo
  ? (arquivotipo?.startswith("image/") ? "imagem" : "arquivo")
  : "texto";


const novamsg = await mensagem.create({
  remetente: remetenteid,
  destinatario: destinatarioid,
  conteudo,
  arquivo,
  arquivonome,
  arquivotipo,
  tipo: tipomsg
});


    const msgpopulada = await mensagem.findbyid(novamsg._id)
      .populate("remetente", "nome email")
      .populate("destinatario", "nome email");

    res.json({ success: true, mensagem: msgpopulada });
  } catch (err) {
    console.error("erro ao salvar mensagem:", err);
    res.status(500).json({ erro: "erro ao salvar mensagem" });
  }
});

// get /api/chat/historico/:usuario1/:usuario2
router.get("/historico/:usuario1/:usuario2", async (req, res) => {
  const { usuario1, usuario2 } = req.params;

  try {
    const u1id = await resolveusuarioid(usuario1);
    const u2id = await resolveusuarioid(usuario2);

    if (!u1id || !u2id) {
      return res.status(404).json({ erro: "um ou ambos usuários não encontrados" });
    }

    const mensagens = await mensagem.find({
  $or: [
    { remetente: u1id, destinatario: u2id },
    { remetente: u2id, destinatario: u1id }
  ]
})
.sort({ data: 1 })
.populate("remetente", "nome email")
.populate("destinatario", "nome email")
.lean(); // deixa como objeto js simples para envio


    res.json(mensagens);
  } catch (err) {
    console.error("erro ao buscar histórico:", err);
    res.status(500).json({ erro: "erro ao buscar histórico" });
  }
});

module.exports = router;


