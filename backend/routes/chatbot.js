// routes/chatbot.js
const express = require('express');
const router = express.Router();

// Base de conhecimento do JIAM
const conhecimentoJIAM = {
  saudacoes: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'oie'],
  respostasSaudacoes: [
    'Olá! 🌾 Sou a assistente do JIAM Preditivo. Como posso ajudar com seu agronegócio hoje?',
    'Oi! 👋 Estou aqui para ajudar com análises de mercado, preços ideais e planejamento de colheita.',
    'Bem-vindo ao JIAM! 🚜 Posso ajudar a otimizar suas decisões agrícolas.'
  ],
  preco: ['preço', 'valor', 'quanto custa', 'precificação', 'valorização'],
  mercado: ['mercado', 'demanda', 'procura', 'vendas', 'comercialização'],
  colheita: ['colheita', 'plantar', 'plantio', 'safra', 'produção'],
  custo: ['custo', 'gasto', 'despesa', 'economia', 'reduzir'],
  conservacao: ['conservar', 'armazenar', 'guardar', 'estoque', 'validade']
};

function gerarRespostaIA(mensagem, produto) {
  const msg = mensagem.toLowerCase();
  
  if (conhecimentoJIAM.saudacoes.some(s => msg.includes(s))) {
    return conhecimentoJIAM.respostasSaudacoes[Math.floor(Math.random() * conhecimentoJIAM.respostasSaudacoes.length)];
  }
  
  if (conhecimentoJIAM.preco.some(p => msg.includes(p))) {
    if (produto) {
      return `💰 Sobre o preço do ${produto.nome}: O valor atual é Kz ${produto.preco?.toLocaleString()}. Recomendo comparar com produtos similares na mesma região. Deseja uma análise detalhada de preço?`;
    }
    return `💰 Para definir o preço ideal, considere: preço de produção (40%), transporte (10%), armazenamento (5%) e margem de lucro (25-35%). Deseja analisar um produto específico?`;
  }
  
  if (conhecimentoJIAM.mercado.some(m => msg.includes(m))) {
    if (produto) {
      return `📈 Análise de mercado para ${produto.nome}: A demanda estimada é de aproximadamente ${Math.round(Math.random() * 100 + 20)} unidades/mês. As melhores regiões para venda são Luanda, Benguela e Huambo.`;
    }
    return `📈 Para análise de mercado, selecione um produto na plataforma. O JIAM analisará demanda, concorrência e tendências para você!`;
  }
  
  if (conhecimentoJIAM.colheita.some(c => msg.includes(c))) {
    if (produto) {
      return `🌾 Planejamento de colheita para ${produto.nome}: Estoque atual: ${produto.quantidade || 0} unidades. Autonomia estimada: ${Math.round((produto.quantidade || 0) / 5)} dias. Recomendo ${(produto.quantidade || 0) < 50 ? 'aumentar produção' : 'manter produção atual'}.`;
    }
    return `🌾 Para planejamento de colheita, selecione um produto. O JIAM analisará estoque, demanda e sugerirá o melhor período para plantio.`;
  }
  
  if (conhecimentoJIAM.custo.some(c => msg.includes(c))) {
    return `📉 Para otimizar custos: 1) Negocie insumos em volume, 2) Otimize rotas de transporte, 3) Invista em embalagens adequadas, 4) Reduza perdas pós-colheita. Deseja uma análise detalhada?`;
  }
  
  if (conhecimentoJIAM.conservacao.some(c => msg.includes(c))) {
    return `❄️ Dicas de conservação: Mantenha em local arejado, controle temperatura e umidade, use embalagens adequadas e evite empilhamento excessivo. Para mais detalhes, selecione um produto.`;
  }
  
  return `📊 Posso ajudar com análises de:
- 💰 Preço ideal e competitividade
- 📈 Demanda e tendências de mercado
- 🌾 Planejamento de colheita
- 📉 Otimização de custos
- ❄️ Estratégias de conservação
Selecione um produto na plataforma para análises específicas!`;
}

router.post('/ia', async (req, res) => {
  try {
    const { mensagem, produto, analise, contexto } = req.body;
    
    if (!mensagem) {
      return res.status(400).json({ success: false, resposta: 'Mensagem vazia' });
    }
    
    const resposta = gerarRespostaIA(mensagem, produto);
    
    res.json({ 
      success: true, 
      resposta,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no chatbot IA:', error);
    res.status(500).json({ success: false, resposta: 'Erro ao processar sua mensagem. Tente novamente.' });
  }
});

module.exports = router;