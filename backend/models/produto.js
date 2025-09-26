const mongoose = require('mongoose');

const produtoschema = new mongoose.schema({
  nome: { type: string, required: true },
  descricao: { type: string },
  preco: { type: number, required: true },
  quantidade: { type: number, required: true, min: 0, default: 0 }, 
reservados: { type: number, default: 0 }, 
  unidade: { type: string, default: "un" },
  imagem: { type: string },
  provincia: { type: string },
  municipio: { type: string },
  localizacaoespecifica: { type: string },

  vendedor: { type: mongoose.schema.types.objectid, ref: 'usuario', required: true },

  contactos: { type: string },          // salva contatos do vendedor
  formapagamento: {
    tipo: { type: string, required: true },
    iban: string,
    numconta: string,
    banco: string,
    opcao: string,
    telefone: string,
  },

  vezesadicionadocarrinho: { type: number, default: 0 },
}, {
  timestamps: true,
});

// previne erro ao registrar modelo mais de uma vez
module.exports = mongoose.models.produto || mongoose.model('produto', produtoschema);
