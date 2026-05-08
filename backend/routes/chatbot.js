// routes/chatbot.js
const express = require('express');
const router = express.Router();
const Produto = require('../models/produto');
const Venda = require('../models/venda');
const Usuario = require('../models/usuario');

// ============ FUNÇÃO PARA NORMALIZAR TEXTO (RESPEITANDO ACENTOS) ============
const normalizarTexto = (texto) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos para comparação
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Remove espaços extras
    .trim();
};

// ============ FUNÇÃO PARA VERIFICAR PALAVRAS-CHAVE (COM VARIAÇÕES) ============
const contemPalavra = (texto, palavra) => {
  const textoNorm = normalizarTexto(texto);
  const palavraNorm = normalizarTexto(palavra);
  return textoNorm.includes(palavraNorm);
};

const contemAlguma = (texto, palavras) => {
  const textoNorm = normalizarTexto(texto);
  return palavras.some(palavra => textoNorm.includes(normalizarTexto(palavra)));
};

// ============ BASE DE CONHECIMENTO DA PLATAFORMA ============
const conhecimentoPlataforma = {
  institucional: {
    nome: "Mercado Yangue",
    criador: "Venâncio Elavoco Cassova Martins",
    missao: "Conectar os angolanos através de uma plataforma digital que valoriza os produtos locais e promove a sustentabilidade económica",
    visao: "Ser o maior e mais confiável mercado digital de Angola, com forte presença nas zonas urbanas e rurais",
    valores: ["Verdade", "Transparência", "Pontualidade", "Responsabilidade", "Sustentabilidade", "Justiça", "Inovação"],
    fundacao: 2024,
    sede: "Angola"
  },
  
  funcionalidades: {
    comprar: "Navegue pelos produtos na aba Produtos, adicione ao carrinho e finalize a compra",
    vender: "Cadastre-se como vendedor/agricultor, aceite o contrato digital e cadastre seus produtos",
    entregador: "Cadastre-se como entregador, informe veículo e placa, e receba solicitações de entrega",
    chat: "Comunique-se diretamente com vendedores e compradores pelo chat integrado",
    jiam: "Sistema de inteligência de dados que analisa mercado, preços e tendências do agronegócio",
    rastreamento: "Acompanhe a origem e localização dos produtos do campo até a entrega",
    avaliacoes: "Avalie vendedores e produtos após cada compra"
  },
  
  faq: {
    "como comprar": "Para comprar, acesse a aba Produtos, selecione o item desejado, escolha a quantidade e clique em 'Adicionar ao Carrinho'. Depois finalize a compra no carrinho.",
    "como vender": "Para vender, cadastre-se como Vendedor/Agricultor, aceite o Contrato Digital (comissão de 0.5% por venda), cadastre seus produtos e aguarde os pedidos.",
    "como se cadastrar": "Clique em 'Iniciar Sessão' > 'Cadastro', preencha seus dados e escolha o tipo de perfil: Cliente, Vendedor/Agricultor ou Entregador.",
    "pagamento": "Os pagamentos são feitos diretamente entre comprador e vendedor via IBAN, transferência bancária, Multicaixa Express ou dinheiro na entrega.",
    "entrega": "As entregas são combinadas entre comprador e vendedor pelo chat. Você também pode solicitar um entregador cadastrado na plataforma.",
    "comissao": "Vendedores/Agricultores pagam 0.5% de comissão sobre cada venda realizada na plataforma.",
    "contrato digital": "O Contrato Digital é aceito no momento do cadastro como vendedor/agricultor, estabelecendo as regras de uso da plataforma.",
    "jiam": "JIAM Preditivo é o sistema de inteligência de dados do Mercado Yangue, que analisa mercado, preços, tendências e ajuda na tomada de decisão agrícola."
  }
};

// ============ PALAVRAS-CHAVE PARA CATEGORIAS ============
const categoriasPalavras = {
  saudacoes: ['olá', 'ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'oie', 'e aí', 'coé', 'salve', 'opa'],
  agradecimentos: ['obrigado', 'obrigada', 'valeu', 'grato', 'agradecido', 'vlw', 'tmj', 'obg'],
  despedidas: ['tchau', 'adeus', 'ate logo', 'ate breve', 'falou', 'flw', 'ate mais', 'ate amanha', 'xau'],
  plataforma: ['quem somos', 'sobre a plataforma', 'o que é o mercadoyangue', 'conhecer', 'plataforma', 'mercado yangue'],
  comprar: ['como comprar', 'comprar', 'como faço para comprar', 'adquirir', 'comprar produto', 'fazer compra'],
  vender: ['como vender', 'vender', 'como faço para vender', 'anunciar produto', 'vender produto', 'colocar produto'],
  entregador: ['entregador', 'como ser entregador', 'entregas', 'como entregar', 'ser entregador', 'tornar entregador'],
  jiam: ['jiam', 'preditivo', 'inteligencia', 'previsao', 'analise', 'jiam preditivo', 'predicoes'],
  rastreamento: ['rastreamento', 'rastrear', 'localizar', 'onde esta', 'acompanhar', 'rastreio'],
  avaliacoes: ['avaliar', 'avaliacao', 'nota', 'estrela', 'avaliar vendedor', 'dar nota'],
  pagamento: ['pagamento', 'pagar', 'forma de pagamento', 'como pago', 'pagamentos', 'multicaixa', 'iban'],
  contrato: ['contrato', 'termos', 'comissao', 'taxa', '0.5', 'meio por cento', 'contrato digital'],
  suporte: ['suporte', 'ajuda', 'contato', 'falar com', 'atendimento', 'problema', 'reclamar', 'duvida'],
  estatisticas: ['estatisticas', 'numeros', 'quantos', 'total', 'tamanho', 'mercado', 'plataforma tem', 'dados'],
  tendencias: ['tendencia', 'tendencias', 'moda', 'mercado esta', 'o que esta vendendo', 'produtos em alta', 'sazonalidade']
};

// ============ FUNÇÃO PARA OBTER ESTATÍSTICAS AGREGADAS ============
async function obterEstatisticasAgregadas() {
  try {
    const totalProdutos = await Produto.countDocuments();
    const totalVendedores = await Usuario.countDocuments({ tipo: { $in: ['vendedor', 'agricultor'] } });
    const totalClientes = await Usuario.countDocuments({ tipo: 'cliente' });
    const totalEntregadores = await Usuario.countDocuments({ tipo: 'entregador' });
    
    const produtosPorCategoria = await Produto.aggregate([
      { $group: { _id: '$categoria', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    const ultimos30Dias = new Date();
    ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);
    const vendasUltimoMes = await Venda.countDocuments({ createdAt: { $gte: ultimos30Dias } });
    
    const produtosMaisVendidos = await Venda.aggregate([
      { $unwind: '$itens' },
      { $group: { _id: '$itens.produtoId', total: { $sum: '$itens.quantidade' } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'produtos', localField: '_id', foreignField: '_id', as: 'produto' } },
      { $unwind: { path: '$produto', preserveNullAndEmptyArrays: true } },
      { $project: { nome: '$produto.nome', total: 1 } }
    ]);
    
    return {
      totalProdutos,
      totalVendedores,
      totalClientes,
      totalEntregadores,
      produtosPorCategoria: produtosPorCategoria.filter(p => p._id),
      vendasUltimoMes,
      produtosMaisVendidos: produtosMaisVendidos.filter(p => p.nome)
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return null;
  }
}

// ============ FUNÇÃO PARA OBTER TENDÊNCIAS AGREGADAS ============
async function obterTendenciasAgregadas() {
  try {
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
    
    const vendasPorMes = await Venda.aggregate([
      { $match: { createdAt: { $gte: seisMesesAtras } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        total: { $sum: 1 },
        receita: { $sum: "$total" }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    const categoriasEmAlta = await Venda.aggregate([
      { $unwind: '$itens' },
      { $lookup: { from: 'produtos', localField: 'itens.produtoId', foreignField: '_id', as: 'produto' } },
      { $unwind: { path: '$produto', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$produto.categoria', total: { $sum: '$itens.quantidade' } } },
      { $sort: { total: -1 } },
      { $limit: 3 }
    ]);
    
    return {
      vendasPorMes,
      categoriasEmAlta: categoriasEmAlta.filter(c => c._id),
      periodoAnalisado: "últimos 6 meses"
    };
  } catch (error) {
    console.error('Erro ao obter tendências:', error);
    return null;
  }
}

// ============ ROTA PRINCIPAL DO CHATBOT ============
router.post('/', async (req, res) => {
  try {
    const { mensagem, sessionId } = req.body;
    
    if (!mensagem) {
      return res.status(400).json({ resposta: "Mensagem vazia recebida." });
    }
    
    const msg = mensagem.toLowerCase();
    let resposta = "";
    
    // ============ SAUDAÇÕES ============
    if (contemAlguma(msg, categoriasPalavras.saudacoes)) {
      resposta = "Olá! Seja bem-vindo ao Mercado Yangue. Sou a assistente virtual da plataforma. Posso ajudar com dúvidas sobre compras, vendas, entregas e o sistema JIAM Preditivo. Como posso ajudar você hoje?";
    }
    
    // ============ AGRADECIMENTOS ============
    else if (contemAlguma(msg, categoriasPalavras.agradecimentos)) {
      resposta = "Por nada! Fico feliz em ajudar. Continue acompanhando o Mercado Yangue para mais novidades. Estamos sempre aqui por você!";
    }
    
    // ============ DESPEDIDAS ============
    else if (contemAlguma(msg, categoriasPalavras.despedidas)) {
      resposta = "Até logo! Volte sempre ao Mercado Yangue. Estamos aqui para conectar você ao melhor do agronegócio angolano.";
    }
    
    // ============ SOBRE A PLATAFORMA ============
    else if (contemAlguma(msg, categoriasPalavras.plataforma)) {
      resposta = `Mercado Yangue é uma plataforma digital angolana criada por Venâncio Elavoco Cassova Martins.
      
Missão: Conectar os angolanos através de uma plataforma digital que valoriza os produtos locais e promove a sustentabilidade económica.

Visão: Ser o maior e mais confiável mercado digital de Angola, com forte presença nas zonas urbanas e rurais.

Valores: Verdade, Transparência, Pontualidade, Responsabilidade, Sustentabilidade, Justiça e Inovação.

A plataforma conecta produtores, vendedores, entregadores e compradores em todo o território nacional.`;
    }
    
    // ============ COMPRAR ============
    else if (contemAlguma(msg, categoriasPalavras.comprar)) {
      resposta = `Para comprar no Mercado Yangue:
      
1. Acesse a aba Produtos
2. Navegue pelos produtos disponíveis
3. Clique em "Adicionar ao Carrinho"
4. Finalize a compra no carrinho
5. Combine a entrega pelo chat com o vendedor

Dica: Você pode solicitar um entregador cadastrado na plataforma!`;
    }
    
    // ============ VENDER ============
    else if (contemAlguma(msg, categoriasPalavras.vender)) {
      resposta = `Para vender no Mercado Yangue:
      
1. Cadastre-se como Vendedor/Agricultor
2. Aceite o Contrato Digital (comissão de 0.5% por venda)
3. Acesse a aba Cadastrar Produto
4. Adicione fotos, descrição, preço e quantidade
5. Aguarde os pedidos dos compradores

Dica: Produtos com fotos de qualidade e descrição detalhada vendem mais!`;
    }
    
    // ============ ENTREGADOR ============
    else if (contemAlguma(msg, categoriasPalavras.entregador)) {
      resposta = `Para ser entregador no Mercado Yangue:
      
1. Cadastre-se como Entregador
2. Informe veículo, placa e telefone
3. Ative sua localização
4. Receba solicitações de entrega
5. Aceite e realize as entregas

Dica: Entregadores ativos com boas avaliações recebem mais solicitações!`;
    }
    
    // ============ JIAM PREDITIVO ============
    else if (contemAlguma(msg, categoriasPalavras.jiam)) {
      resposta = `JIAM Preditivo é o sistema de inteligência de dados do Mercado Yangue.

Funcionalidades:
- Análise de tendências de mercado
- Sugestão de preço ideal
- Mapa de procura por região
- Planejamento de colheita
- Estratégias de conservação
- Otimização de custos

Acesse a aba JIAM Previsões para análises detalhadas dos seus produtos!`;
    }
    
    // ============ RASTREAMENTO ============
    else if (contemAlguma(msg, categoriasPalavras.rastreamento)) {
      resposta = `Rastreamento Mercado Yangue:
      
- Produtores podem rastrear suas plantações
- Entregadores compartilham localização em tempo real
- Compradores acompanham a entrega
- Mapa com rotas e instruções de navegação

Acesse a aba Rastrear para acompanhar!`;
    }
    
    // ============ AVALIAÇÕES ============
    else if (contemAlguma(msg, categoriasPalavras.avaliacoes)) {
      resposta = `Avaliações no Mercado Yangue:
      
- Após cada compra, você pode avaliar o vendedor
- Notas de 1 a 5 estrelas
- Comentários públicos ajudam outros compradores
- Vendedores com boas avaliações ganham destaque

Sua opinião é importante para a comunidade!`;
    }
    
    // ============ PAGAMENTO ============
    else if (contemAlguma(msg, categoriasPalavras.pagamento)) {
      resposta = `Formas de Pagamento Aceitas:
      
- Transferência Bancária (IBAN)
- Multicaixa Express
- Dinheiro na Entrega
- Depósito Bancário

O pagamento é feito diretamente entre comprador e vendedor. A plataforma não retém valores, apenas cobra comissão de 0.5% dos vendedores após a venda.`;
    }
    
    // ============ CONTRATO E COMISSÃO ============
    else if (contemAlguma(msg, categoriasPalavras.contrato)) {
      resposta = `Contrato Digital e Comissões:

- Vendedores/Agricultores aceitam o Contrato Digital no cadastro
- Comissão da plataforma: 0.5% sobre cada venda
- Prazo para pagamento da comissão: 5 dias úteis após a entrega
- IBAN para pagamento: AO06 0000 0000 1234 5678 9012 3456 7
- Beneficiário: Mercado Yangue Serviços Digitais

O contrato garante segurança e transparência para todos!`;
    }
    
    // ============ SUPORTE E CONTATO ============
    else if (contemAlguma(msg, categoriasPalavras.suporte)) {
      resposta = `Canais de Suporte Mercado Yangue:
      
WhatsApp: +244 928 565 837
Email: mercadoyangueservicosdigitais@gmail.com
Chat na plataforma (aba Bate-Papo)
Guia de Utilização disponível na plataforma

Nossa equipe está disponível para ajudar 24 horas por dia, 7 dias por semana!`;
    }
    
    // ============ ESTATÍSTICAS DA PLATAFORMA ============
    else if (contemAlguma(msg, categoriasPalavras.estatisticas)) {
      const stats = await obterEstatisticasAgregadas();
      if (stats) {
        resposta = `Mercado Yangue em Números:
        
- ${stats.totalProdutos} produtos cadastrados
- ${stats.totalVendedores} vendedores e agricultores ativos
- ${stats.totalClientes} clientes cadastrados
- ${stats.totalEntregadores} entregadores disponíveis
- ${stats.vendasUltimoMes} vendas nos últimos 30 dias

Produtos mais vendidos: ${stats.produtosMaisVendidos.slice(0, 3).map(p => p.nome).join(', ') || 'em análise'}

Continue acompanhando o crescimento da nossa comunidade!`;
      } else {
        resposta = "Estamos crescendo diariamente! Em breve teremos números atualizados da plataforma. Continue acompanhando!";
      }
    }
    
    // ============ TENDÊNCIAS DE MERCADO ============
    else if (contemAlguma(msg, categoriasPalavras.tendencias)) {
      const tendencias = await obterTendenciasAgregadas();
      if (tendencias && tendencias.categoriasEmAlta.length > 0) {
        resposta = `Tendências de Mercado - ${tendencias.periodoAnalisado}:
        
Categorias em alta: ${tendencias.categoriasEmAlta.map(c => c._id).join(', ')}
Crescimento de vendas: Observamos aumento significativo nas transações

Dica: Acesse a aba JIAM Previsões para análises detalhadas e identificar oportunidades de mercado!`;
      } else {
        resposta = "Estamos analisando as tendências de mercado! Acesse a aba JIAM Previsões para visualizar dados específicos dos seus produtos e identificar melhores oportunidades de venda.";
      }
    }
    
    // ============ RESPOSTA PADRÃO ============
    else {
      resposta = `Ainda estou aprendendo sobre essa pergunta. Posso ajudar com:
      
- Informações da plataforma (quem somos, funcionalidades)
- Como comprar e vender
- Sistema JIAM Preditivo (previsões, análises)
- Entregas e rastreamento
- Suporte e contato

Tente perguntar de outra forma ou acesse nosso Guia de Utilização na plataforma!`;
    }
    
    res.json({ resposta });
    
  } catch (error) {
    console.error('Erro no chatbot:', error);
    res.status(500).json({ 
      resposta: `Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde. Se o problema persistir, entre em contato com nosso suporte pelo WhatsApp +244 928 565 837.` 
    });
  }
});

// ============ ROTA PARA SUGESTÕES DE PERGUNTAS ============
router.get('/sugestoes', (req, res) => {
  res.json({
    sugestoes: [
      "Como comprar no Mercado Yangue?",
      "Como vender na plataforma?",
      "Quais as formas de pagamento?",
      "Como funciona o JIAM Preditivo?",
      "Quero ser entregador, como faço?",
      "Qual a comissão da plataforma?",
      "Como rastrear minha entrega?",
      "Estatísticas da plataforma",
      "Tendências de mercado",
      "Contato com suporte"
    ]
  });
});

module.exports = router;