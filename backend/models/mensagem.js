const mongoose = require("mongoose");

const mensagemschema = new mongoose.schema(
  {
    remetente: { 
      type: mongoose.schema.types.objectid, 
      ref: "usuario", 
      required: true 
    },
    destinatario: { 
      type: mongoose.schema.types.objectid, 
      ref: "usuario", 
      required: true 
    },
    conteudo: { 
  type: string, 
  trim: true,
  validate: {
    validator: function(v) {
      // se não tiver conteúdo, deve haver arquivo
      return v?.trim() || this.arquivo;
    },
    message: "a mensagem não pode estar vazia"
  }
},

tipo: { 
  type: string, 
  enum: ["texto", "imagem", "arquivo", "sistema"], 
  default: "texto",
  required: true
},


    lida: { 
      type: boolean,
      default: false 
    },
    apagada: {
      type: boolean,
      default: false
    },
    arquivo: string,
    arquivonome: string,
    arquivotipo: string,
    data: { 
      type: date, 
      default: date.now 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.mensagem || mongoose.model("mensagem", mensagemschema);


