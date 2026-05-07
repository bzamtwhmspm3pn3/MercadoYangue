// routes/chatbot.js
const express = require('express');
const router = express.Router();
const Produto = require('../models/produto');
const Venda = require('../models/venda');
const Usuario = require('../models/usuario');

// ============ BASE DE CONHECIMENTO DA PLATAFORMA ============
const conhecimentoPlataforma = {
  // Informações institucionais
  institucional: {
    nome: "Mercado Yangue",
    criador: "Venâncio Elavoco Cassova Martins",
    missao: "Conectar os angolanos através de uma plataforma digital que valoriza os produtos locais e promove a sustentabilidade económica",
    visao: "Ser o maior e mais confiável mercado digital de Angola, com forte presença nas zonas urbanas e rurais",
    valores: ["Verdade", "Transparência", "Pontualidade", "Responsabilidade", "Sustentabilidade", "Justiça", "Inovação"],
    fundacao: 2024,
    sede: "Angola"
  },
  
  // Funcionalidades da plataforma
  funcionalidades: {
    comprar: "Navegue pelos produtos na aba Produtos, adicione ao carrinho e finalize a compra",
    vender: "Cadastre-se como vendedor/agricultor, aceite o contrato digital e cadastre seus produtos",
    entregador: "Cadastre-se como entregador, informe veículo e placa, e receba solicitações de entrega",
    chat: "Comunique-se diretamente com vendedores e compradores pelo chat integrado",
    jiam: "Sistema de inteligência de dados que analisa mercado, preços e tendências do agronegócio",
    rastreamento: "Acompanhe a origem e localização dos produtos do campo até a entrega",
    avaliacoes: "Avalie vendedores e produtos após cada compra"
  },
  
  // Perguntas frequentes
  faq: {
    "como comprar": "Para comprar, acesse a aba Produtos, selecione o item desejado, escolha a quantidade e clique em 'Adicionar ao Carrinho'. Depois finalize a compra no carrinho.",
    "como vender": "Para vender, cadastre-se como Vendedor/Agricultor, aceite o Contrato Digital (comissão de 0,5% por venda), cadastre seus produtos e aguarde os pedidos.",
    "como se cadastrar": "Clique em 'Iniciar Sessão' > 'Cadastro', preencha seus dados e escolha o tipo de perfil: Cliente, Vendedor/Agricultor ou Entregador.",
    "pagamento": "Os pagamentos são feitos diretamente entre comprador e vendedor via IBAN, transferência bancária, Multicaixa Express ou dinheiro na entrega.",
    "entrega": "As entregas são combinadas entre comprador e vendedor pelo chat. Você também pode solicitar um entregador cadastrado na plataforma.",
    "comissao": "Vendedores/Agricultores pagam 0,5% de comissão sobre cada venda realizada na plataforma.",
    "contrato digital": "O Contrato Digital é aceito no momento do cadastro como vendedor/agricultor, estabelecendo as regras de uso da plataforma.",
    "jiam": "JIAM Preditivo é o sistema de inteligência de dados do Mercado Yangue, que analisa mercado, preços, tendências e ajuda na tomada de decisão agrícola."
  }
};

// ============ FUNÇÃO PARA OBTER ESTATÍSTICAS AGREGADAS (SEM DADOS INDIVIDUAIS) ============
async function obterEstatisticasAgregadas() {
  try {
    const totalProdutos = await Produto.countDocuments();
    const totalVendedores = await Usuario.countDocuments({ tipo: { $in: ['vendedor', 'agricultor'] } });
    const totalClientes = await Usuario.countDocuments({ tipo: 'cliente' });
    const totalEntregadores = await Usuario.countDocuments({ tipo: 'entregador' });
    
    // Produtos por categoria (agregado)
    const produtosPorCategoria = await Produto.aggregate([
      { $group: { _id: '$categoria', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Vendas por período (últimos 30 dias)
    const ultimos30Dias = new Date();
    ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);
    const vendasUltimoMes = await Venda.countDocuments({ createdAt: { $gte: ultimos30Dias } });
    
    // Produtos mais vendidos (agregado)
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

// ============ FUNÇÃO PARA ANALISAR TENDÊNCIAS (DADOS AGREGADOS) ============
async function obterTendenciasAgregadas() {
  try {
    // Vendas por mês (últimos 6 meses)
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
    
    // Categorias em alta
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
      return res.status(400).json({ resposta: "Mensagem vazia recebida. 🤔" });
    }
    
    const msg = mensagem.toLowerCase().trim();
    let resposta = "";
    
    // ============ SAUDAÇÕES ============
    if (/(olá|ola|oi|bom dia|boa tarde|boa noite|oie|e aí|coé)/.test(msg)) {
      resposta = `👋 Olá! Sou a assistente virtual do **Mercado Yangue**. Estou aqui para ajudar com dúvidas sobre a plataforma, compras, vendas, entregas e o sistema JIAM Preditivo. Como posso ajudá-lo hoje?`;
    }
    
    // ============ AGRADECIMENTOS ============
    else if (/(obrigad[ao]|valeu|grato|agradecido|vlw)/.test(msg)) {
      resposta = `😊 Por nada! É sempre um prazer ajudar. Continue acompanhando o Mercado Yangue para mais novidades. Estamos aqui por você!`;
    }
    
    // ============ DESPEDIDAS ============
    else if (/(tchau|adeus|até logo|até breve|falou|flw|até mais)/.test(msg)) {
      resposta = `👋 Até logo! Volte sempre ao Mercado Yangue. Estamos aqui para conectar você ao melhor do agronegócio angolano.`;
    }
    
    // ============ SOBRE A PLATAFORMA ============
    else if (/(quem somos|sobre a plataforma|o que é o mercadoyangue|conhecer|plataforma)/.test(msg)) {
      resposta = `🌾 **Mercado Yangue** é uma plataforma digital angolana criada por ${conhecimentoPlataforma.institucional.criador}. 
      
📌 **Missão:** ${conhecimentoPlataforma.institucional.missao}
📌 **Visão:** ${conhecimentoPlataforma.institucional.visao}
📌 **Valores:** ${conhecimentoPlataforma.institucional.valores.join(', ')}

A plataforma conecta produtores, vendedores, entregadores e compradores em todo o território nacional, promovendo o comércio local e a sustentabilidade económica.`;
    }
    
    // ============ FUNCIONALIDADES ============
    else if (/(como comprar|comprar|como faço para comprar|adquirir)/.test(msg)) {
      resposta = `🛒 **Como comprar no Mercado Yangue:**
      
1️⃣ Acesse a aba **Produtos**
2️⃣ Navegue pelos produtos disponíveis
3️⃣ Clique em "Adicionar ao Carrinho"
4️⃣ Finalize a compra no carrinho
5️⃣ Combine a entrega pelo chat com o vendedor

💡 Dica: Você pode solicitar um entregador cadastrado na plataforma!`;
    }
    
    else if (/(como vender|vender|como faço para vender|anunciar produto)/.test(msg)) {
      resposta = `🌾 **Como vender no Mercado Yangue:**
      
1️⃣ Cadastre-se como **Vendedor/Agricultor**
2️⃣ Aceite o **Contrato Digital** (comissão de 0,5% por venda)
3️⃣ Acesse a aba **Cadastrar Produto**
4️⃣ Adicione fotos, descrição, preço e quantidade
5️⃣ Aguarde os pedidos dos compradores

💡 Dica: Produtos com fotos de qualidade e descrição detalhada vendem mais!`;
    }
    
    else if (/(entregador|como ser entregador|entregas|como entregar)/.test(msg)) {
      resposta = `🚚 **Como ser Entregador no Mercado Yangue:**
      
1️⃣ Cadastre-se como **Entregador**
2️⃣ Informe veículo, placa e telefone
3️⃣ Ative sua localização
4️⃣ Receba solicitações de entrega
5️⃣ Aceite e realize as entregas

💡 Dica: Entregadores ativos com boas avaliações recebem mais solicitações!`;
    }
    
    else if (/(jiam|preditivo|inteligência|previsão|análise)/.test(msg)) {
      resposta = `📊 **JIAM Preditivo** é o sistema de inteligência de dados do Mercado Yangue.

🔍 **Funcionalidades:**
- 📈 Análise de tendências de mercado
- 💰 Sugestão de preço ideal
- 🗺️ Mapa de procura por região
- 🌾 Planejamento de colheita
- ❄️ Estratégias de conservação
- 📉 Otimização de custos

💡 Acesse a aba **JIAM Previsões** para análises detalhadas dos seus produtos!`;
    }
    
    else if (/(rastreamento|rastrear|localizar|onde está)/.test(msg)) {
      resposta = `🗺️ **Rastreamento Mercado Yangue:**
      
✅ Produtores podem rastrear suas plantações
✅ Entregadores compartilham localização em tempo real
✅ Compradores acompanham a entrega
✅ Mapa com rotas e instruções de navegação

💡 Acesse a aba **Rastrear** para acompanhar!`;
    }
    
    else if (/(avaliar|avaliação|nota|estrela)/.test(msg)) {
      resposta = `⭐ **Avaliações no Mercado Yangue:**
      
✅ Após cada compra, você pode avaliar o vendedor
✅ Notas de 1 a 5 estrelas
✅ Comentários públicos ajudam outros compradores
✅ Vendedores com boas avaliações ganham destaque

💡 Sua opinião é importante para a comunidade!`;
    }
    
    // ============ DÚVIDAS SOBRE PAGAMENTO ============
    else if (/(pagamento|pagar|forma de pagamento|como pago)/.test(msg)) {
      resposta = `💰 **Formas de Pagamento Aceitas:**
      
💳 **Transferência Bancária (IBAN)**
📱 **Multicaixa Express**
💵 **Dinheiro na Entrega**
🏦 **Depósito Bancário**

💡 O pagamento é feito **diretamente entre comprador e vendedor**. A plataforma não retém valores, apenas cobra comissão de 0,5% dos vendedores após a venda.`;
    }
    
    // ============ CONTRATO E COMISSÃO ============
    else if (/(contrato|termos|comissão|0,5|taxa)/.test(msg)) {
      resposta = `📜 **Contrato Digital e Comissões:**

✅ Vendedores/Agricultores aceitam o Contrato Digital no cadastro
✅ Comissão da plataforma: **0,5%** sobre cada venda
✅ Prazo para pagamento da comissão: 5 dias úteis após a entrega
✅ IBAN para pagamento: **AO06 0000 0000 1234 5678 9012 3456 7**
✅ Beneficiário: **Mercado Yangue Serviços Digitais**

💡 O contrato garante segurança e transparência para todos!`;
    }
    
    // ============ SUPORTE E CONTATO ============
    else if (/(suporte|ajuda|contato|falar com|atendimento|problema)/.test(msg)) {
      resposta = `📞 **Canais de Suporte Mercado Yangue:**
      
📱 **WhatsApp:** +244 928 565 837
✉️ **Email:** mercadoyangueservicosdigitais@gmail.com
💬 **Chat na plataforma** (aba Bate-Papo)
📖 **Guia de Utilização** disponível na plataforma

💡 Nossa equipe está disponível para ajudar 24/7!`;
    }
    
    // ============ ESTATÍSTICAS DA PLATAFORMA (DADOS AGREGADOS) ============
    else if (/(estatísticas|números|quantos|total|tamanho|mercado|plataforma tem)/.test(msg)) {
      const stats = await obterEstatisticasAgregadas();
      if (stats) {
        resposta = `📊 **Mercado Yangue em Números:**
        
📦 **${stats.totalProdutos}** produtos cadastrados
👨‍🌾 **${stats.totalVendedores}** vendedores/agricultores ativos
👥 **${stats.totalClientes}** clientes cadastrados
🚚 **${stats.totalEntregadores}** entregadores disponíveis
🛒 **${stats.vendasUltimoMes}** vendas nos últimos 30 dias

📈 **Produtos mais vendidos:** ${stats.produtosMaisVendidos.slice(0, 3).map(p => p.nome).join(', ') || 'em análise'}

💡 Continue acompanhando o crescimento da nossa comunidade!`;
      } else {
        resposta = `📊 Estamos crescendo diariamente! Em breve teremos números atualizados da plataforma. Continue acompanhando!`;
      }
    }
    
    // ============ TENDÊNCIAS DE MERCADO (DADOS AGREGADOS) ============
    else if (/(tendência|tendencias|moda|mercado está|o que está vendendo|produtos em alta)/.test(msg)) {
      const tendencias = await obterTendenciasAgregadas();
      if (tendencias && tendencias.categoriasEmAlta.length > 0) {
        resposta = `📈 **Tendências de Mercado - ${tendencias.periodoAnalisado}:**
        
🔥 **Categorias em alta:** ${tendencias.categoriasEmAlta.map(c => c._id).join(', ')}
📊 **Crescimento de vendas:** Observamos aumento significativo nas transações

💡 **Dica JIAM:** Acesse a aba **JIAM Previsões** para análises detalhadas dos seus produtos e identificar oportunidades de mercado!`;
      } else {
        resposta = `📈 Estamos analisando as tendências de mercado! Acesse a aba **JIAM Previsões** para visualizar dados específicos dos seus produtos e identificar melhores oportunidades de venda.`;
      }
    }
    
    // ============ AJUDA SOBRE JIAM ============
    else if (/(como usar o jiam|jiam funciona|previsões|análise de produto)/.test(msg)) {
      resposta = `📊 **Como usar o JIAM Preditivo:**

1️⃣ Acesse a aba **JIAM Previsões**
2️⃣ Selecione um produto da sua lista
3️⃣ O sistema analisará:
   - 📈 **Tendências de demanda**
   - 💰 **Preço ideal de venda**
   - 🗺️ **Melhores regiões para vender**
   - 🌾 **Planejamento de colheita**
   - 📉 **Otimização de custos**

💡 Quanto mais vendas você tiver, mais precisas serão as análises! Produtos novos recebem análises baseadas no mercado.`;
    }
    
    // ============ RESPOSTA PADRÃO ============
    else {
      resposta = `🤔 Ainda estou aprendendo sobre essa pergunta específica. Posso ajudar com:
      
📌 **Informações da plataforma:** quem somos, funcionalidades, como comprar/vender
📌 **Sistema JIAM Preditivo:** previsões, análises de mercado, preço ideal
📌 **Entregas e rastreamento:** como funciona o sistema de entregas
📌 **Suporte e contato:** canais para tirar dúvidas

Tente perguntar de outra forma ou acesse nosso **Guia de Utilização** na plataforma!`;
    }
    
    res.json({ resposta });
    
  } catch (error) {
    console.error('Erro no chatbot:', error);
    res.status(500).json({ 
      resposta: `❌ Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde. Se o problema persistir, entre em contato com nosso suporte pelo WhatsApp ${process.env.WHATSAPP_NUMBER || '+244 928 565 837'}.` 
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