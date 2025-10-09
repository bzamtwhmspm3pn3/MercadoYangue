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
  trim: true,
  validate: {
    validator: function(v) {
      // se não tiver conteúdo, deve haver arquivo
      return v?.trim() || this.arquivo;
    },
    message: "A mensagem não pode estar vazia"
  }
},

tipo: { 
  type: String, 
  enum: ["texto", "imagem", "arquivo", "sistema"], 
  default: "texto",
  required: true
},


    lida: { 
      type: Boolean,
      default: false 
    },
    apagada: {
      type: Boolean,
      default: false
    },
    arquivo: String,
    arquivoNome: String,
    arquivoTipo: String,
    imagem: String,
    data: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Mensagem || mongoose.model("Mensagem", mensagemSchema);


