const express = require("express");
const router = express.Router();
const Mensagem = require("../models/mensagem");
const { authMiddleware } = require("../middlewares/auth");

// 📩 Enviar mensagem
router.post("/enviar", authMiddleware, async (req, res) => {
  try {
    const { destinatario, conteudo } = req.body;

    if (!destinatario || !conteudo?.trim()) {
      return res.status(400).json({ erro: "Destinatário e conteúdo são obrigatórios" });
    }

    const novaMensagem = new Mensagem({
      remetente: req.user.id, // 🔹 vem do token JWT
      destinatario,
      conteudo: conteudo.trim(),
      tipo: "texto"
    });

    await novaMensagem.save();

    res.status(201).json({
      msg: "Mensagem enviada com sucesso!",
      mensagem: novaMensagem
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).json({ erro: "Erro ao enviar mensagem" });
  }
});

// 📥 Buscar mensagens entre dois utilizadores
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const mensagens = await Mensagem.find({
      $or: [
        { remetente: req.user.id, destinatario: userId },
        { remetente: userId, destinatario: req.user.id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate("remetente", "nome")
      .populate("destinatario", "nome");

    res.json(mensagens);
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
    res.status(500).json({ erro: "Erro ao carregar mensagens" });
  }
});

// ✅ Marcar mensagens como lidas
router.put("/marcar-lidas/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    await Mensagem.updateMany(
      { remetente: userId, destinatario: req.user.id, lida: false },
      { $set: { lida: true } }
    );

    res.json({ msg: "Mensagens marcadas como lidas" });
  } catch (error) {
    console.error("Erro ao marcar mensagens:", error);
    res.status(500).json({ erro: "Erro ao atualizar mensagens" });
  }
});

module.exports = router;
