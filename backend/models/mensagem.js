
const mongoose = require("mongoose");

const mensagemSchema = new mongoose.Schema(
  {
    remetente: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Usuario", 
      required: true 
    },
    destinatario: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Usuario", 
      required: true 
    },
    conteudo: { 
      type: String, 
      trim: true, // 🔹 remove espaços extras
      required: [true, "A mensagem não pode estar vazia"] 
    },
    tipo: { 
      type: String, 
      enum: ["texto", "imagem", "sistema"], 
      default: "texto" 
    },
    lida: { 
      type: Boolean, 
      default: false 
    },
    apagada: {
      type: Boolean,
      default: false // 🔹 caso o usuário apague, mas mantenha no histórico
    },
    data: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    timestamps: true // 🔹 cria automaticamente createdAt e updatedAt
  }
);

// ✅ Correção: evita OverwriteModelError
module.exports = mongoose.models.Mensagem || mongoose.model("Mensagem", mensagemSchema);
