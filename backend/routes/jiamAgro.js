// routes/jiamAgro.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Produto = require('../models/produto');
const Venda = require('../models/venda');

// ========== BANCO DE DADOS DE CONHECIMENTO AGRÍCOLA ==========
const conhecimentoAgricola = {
  // Estratégias de conservação por tipo de produto
  conservacao: {
    'frutas': {
      temperatura: '8-12°C',
      umidade: '85-90%',
      metodo: 'Refrigeração com controle de etileno',
      tempo_maximo: '7-14 dias',
      dicas: [
        'Não lavar antes de armazenar',
        'Separar frutas que produzem etileno (banana, maçã)',
        'Armazenar em local arejado'
      ]
    },
    'legumes': {
      temperatura: '4-8°C',
      umidade: '90-95%',
      metodo: 'Refrigeração com alta umidade',
      tempo_maximo: '5-10 dias',
      dicas: [
        'Remover folhas danificadas',
        'Armazenar em sacos perfurados',
        'Não armazenar junto com frutas'
      ]
    },
    'raizes': {
      temperatura: '12-18°C',
      umidade: '60-70%',
      metodo: 'Ambiente seco e escuro',
      tempo_maximo: '30-60 dias',
      dicas: [
        'Armazenar em local seco',
        'Não lavar antes de guardar',
        'Remover brotos e partes danificadas'
      ]
    },
    'graos': {
      temperatura: '15-20°C',
      umidade: '50-60%',
      metodo: 'Silos ou recipientes herméticos',
      tempo_maximo: '180-365 dias',
      dicas: [
        'Manter longe de umidade',
        'Usar recipientes herméticos',
        'Adicionar folhas de louro contra pragas'
      ]
    },
    'folhosas': {
      temperatura: '0-4°C',
      umidade: '95-100%',
      metodo: 'Refrigeração com alta umidade',
      tempo_maximo: '3-5 dias',
      dicas: [
        'Consumir rapidamente',
        'Armazenar em sacos com perfurações',
        'Não compactar'
      ]
    }
  },

  // Dados de mercado por província
  mercadoAngola: {
    'Luanda': {
      demanda: 'Alta',
      preco_medio_relativo: 1.3,
      sazonalidade: 'Ano todo',
      logistica: 'Facilitada',
      consumidores: 'Famílias, restaurantes, supermercados'
    },
    'Benguela': {
      demanda: 'Média-Alta',
      preco_medio_relativo: 1.15,
      sazonalidade: 'Ano todo',
      logistica: 'Moderada',
      consumidores: 'Famílias, mercados locais'
    },
    'Huambo': {
      demanda: 'Média',
      preco_medio_relativo: 1.0,
      sazonalidade: 'Safra: maior oferta',
      logistica: 'Moderada',
      consumidores: 'Famílias, feiras'
    },
    'Bié': {
      demanda: 'Média',
      preco_medio_relativo: 0.95,
      sazonalidade: 'Sazonal',
      logistica: 'Difícil',
      consumidores: 'Consumo local, feiras'
    },
    'Namibe': {
      demanda: 'Média-Baixa',
      preco_medio_relativo: 1.2,
      sazonalidade: 'Depende do produto',
      logistica: 'Moderada',
      consumidores: 'Turismo, famílias'
    }
  }
};

// ========== FUNÇÃO AUXILIAR PARA DETECTAR CATEGORIA ==========
function detectarCategoria(nomeProduto) {
  const produto = nomeProduto.toLowerCase();
  
  if (produto.includes('banana') || produto.includes('maçã') || produto.includes('laranja') || 
      produto.includes('manga') || produto.includes('abacaxi') || produto.includes('mamão')) {
    return 'frutas';
  }
  if (produto.includes('tomate') || produto.includes('cebola') || produto.includes('alho') || 
      produto.includes('pimentão') || produto.includes('abóbora') || produto.includes('pepino')) {
    return 'legumes';
  }
  if (produto.includes('batata') || produto.includes('mandioca') || produto.includes('inhame') || 
      produto.includes('cenoura') || produto.includes('beterraba') || produto.includes('nabo')) {
    return 'raizes';
  }
  if (produto.includes('feijão') || produto.includes('milho') || produto.includes('arroz') || 
      produto.includes('trigo') || produto.includes('soja') || produto.includes('amendoim')) {
    return 'graos';
  }
  if (produto.includes('alface') || produto.includes('couve') || produto.includes('espinafre')) {
    return 'folhosas';
  }
  
  return 'legumes'; // padrão
}

// ========== 1. ANÁLISE COMPLETA DO PRODUTO ==========
router.get('/analise-produto/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const produto = await Produto.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
    
    const categoria = detectarCategoria(produto.nome);
    const vendas = await Venda.find({ 'itens.produtoId': produtoId });
    
    const totalVendido = vendas.reduce((sum, venda) => {
      const item = venda.itens.find(i => i.produtoId.toString() === produtoId);
      return sum + (item?.quantidade || 0);
    }, 0);
    
    const receitaTotal = vendas.reduce((sum, venda) => {
      const item = venda.itens.find(i => i.produtoId.toString() === produtoId);
      return sum + (item?.valorTotal || 0);
    }, 0);
    
    const vendasPorMes = {};
    vendas.forEach(venda => {
      const mes = new Date(venda.createdAt).toLocaleString('pt-AO', { month: 'long', year: 'numeric' });
      const item = venda.itens.find(i => i.produtoId.toString() === produtoId);
      if (item) {
        vendasPorMes[mes] = (vendasPorMes[mes] || 0) + item.quantidade;
      }
    });
    
    res.json({
      success: true,
      produto: {
        id: produto._id,
        nome: produto.nome,
        categoria,
        preco_atual: produto.preco,
        quantidade_estoque: produto.quantidade,
        provincia: produto.provincia,
        municipio: produto.municipio
      },
      desempenho: {
        total_vendido: totalVendido,
        receita_total: totalVendido * produto.preco,
        numero_vendas: vendas.length,
        taxa_conversao: totalVendido > 0 ? ((vendas.length / totalVendido) * 100).toFixed(2) : 0
      },
      vendas_por_mes: vendasPorMes,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro na análise do produto:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 2. PREVISÃO DE MERCADO ==========
router.post('/previsao-mercado', async (req, res) => {
  try {
    const { produtoId, provincia } = req.body;
    
    const produto = await Produto.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
    
    const vendas = await Venda.find({ 'itens.produtoId': produtoId });
    const vendasUltimos30Dias = vendas.filter(v => 
      new Date(v.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    const mediaMensal = vendasUltimos30Dias.length;
    const projecaoTrimestral = mediaMensal * 3;
    const projecaoAnual = mediaMensal * 12;
    
    const dadosMercado = provincia && conhecimentoAgricola.mercadoAngola[provincia] 
      ? conhecimentoAgricola.mercadoAngola[provincia]
      : conhecimentoAgricola.mercadoAngola[produto.provincia] || conhecimentoAgricola.mercadoAngola['Luanda'];
    
    let tendencia = 'Estável';
    let crescimentoPercentual = 0;
    
    if (vendas.length > 3) {
      const primeiroMes = vendas.slice(0, 3).length;
      const ultimoMes = vendas.slice(-3).length;
      
      if (ultimoMes > primeiroMes) {
        tendencia = 'Crescimento';
        crescimentoPercentual = ((ultimoMes - primeiroMes) / primeiroMes) * 100;
      } else if (ultimoMes < primeiroMes) {
        tendencia = 'Queda';
        crescimentoPercentual = ((primeiroMes - ultimoMes) / primeiroMes) * 100;
      }
    }
    
    res.json({
      success: true,
      produto: produto.nome,
      provincia_analisada: provincia || produto.provincia,
      mercado: dadosMercado,
      previsao: {
        demanda_mensal_estimada: Math.max(1, mediaMensal),
        projecao_trimestral: Math.max(3, projecaoTrimestral),
        projecao_anual: Math.max(12, projecaoAnual),
        tendencia,
        crescimento_percentual: crescimentoPercentual.toFixed(1),
        confianca: vendas.length > 50 ? 'Alta' : vendas.length > 20 ? 'Média' : 'Baixa'
      },
      recomendacoes: [
        crescimentoPercentual > 20 ? 'Considerar aumentar produção' : 'Manter produção atual',
        dadosMercado.demanda === 'Alta' ? 'Expandir para novas regiões' : 'Fortalecer mercado atual',
        'Acompanhar sazonalidade para melhor planejamento'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro na previsão de mercado:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 3. MAPA DE PROCURA (ONDE TEM MAIS PROCURA) ==========
router.get('/mapa-procura/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const vendas = await Venda.find({ 'itens.produtoId': produtoId })
      .populate('comprador', 'provincia municipio');
    
    const procuraPorProvincia = {};
    const procuraPorMunicipio = {};
    
    vendas.forEach(venda => {
      if (venda.comprador?.provincia) {
        procuraPorProvincia[venda.comprador.provincia] = (procuraPorProvincia[venda.comprador.provincia] || 0) + 1;
      }
      if (venda.comprador?.municipio) {
        procuraPorMunicipio[venda.comprador.municipio] = (procuraPorMunicipio[venda.comprador.municipio] || 0) + 1;
      }
    });
    
    // Ordenar por maior procura
    const provinciasOrdenadas = Object.entries(procuraPorProvincia)
      .sort((a, b) => b[1] - a[1]);
    
    const municipiosOrdenados = Object.entries(procuraPorMunicipio)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    res.json({
      success: true,
      top_provincias: provinciasOrdenadas.map(([nome, vendas]) => ({ nome, vendas })),
      top_municipios: municipiosOrdenados.map(([nome, vendas]) => ({ nome, vendas })),
      recomendacao_venda: provinciasOrdenadas[0]?.nome || 'Expandir presença',
      total_vendas_analisadas: vendas.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro no mapa de procura:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 4. PREÇO IDEAL POR REGIÃO ==========
router.get('/preco-ideal/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const produto = await Produto.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
    
    const categoria = detectarCategoria(produto.nome);
    const vendas = await Venda.find({ 'itens.produtoId': produtoId });
    
    // Preços por região
    const precosPorRegiao = {};
    vendas.forEach(venda => {
      const item = venda.itens.find(i => i.produtoId.toString() === produtoId);
      if (item && venda.comprador?.provincia) {
        const precoUnitario = item.valorTotal / item.quantidade;
        if (!precosPorRegiao[venda.comprador.provincia]) {
          precosPorRegiao[venda.comprador.provincia] = [];
        }
        precosPorRegiao[venda.comprador.provincia].push(precoUnitario);
      }
    });
    
    const precoMedioPorRegiao = {};
    Object.entries(precosPorRegiao).forEach(([provincia, precos]) => {
      const media = precos.reduce((a, b) => a + b, 0) / precos.length;
      precoMedioPorRegiao[provincia] = media;
    });
    
    // Preço ideal sugerido
    const precoAtual = produto.preco;
    const mediaGeral = Object.values(precoMedioPorRegiao).length > 0
      ? Object.values(precoMedioPorRegiao).reduce((a, b) => a + b, 0) / Object.values(precoMedioPorRegiao).length
      : precoAtual;
    
    let recomendacao = 'Manter preço';
    let precoIdeal = precoAtual;
    
    if (precoAtual > mediaGeral * 1.2) {
      recomendacao = 'Reduzir preço para aumentar competitividade';
      precoIdeal = mediaGeral;
    } else if (precoAtual < mediaGeral * 0.8) {
      recomendacao = 'Aumentar preço gradualmente';
      precoIdeal = mediaGeral;
    }
    
    res.json({
      success: true,
      produto: produto.nome,
      preco_atual: precoAtual,
      preco_medio_mercado: mediaGeral,
      preco_ideal_sugerido: precoIdeal,
      precos_por_regiao: precoMedioPorRegiao,
      recomendacao,
      margem_sugerida: ((precoIdeal - (precoAtual * 0.6)) / precoIdeal * 100).toFixed(1),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro no preço ideal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 5. TEMPO MÉDIO DE CONVERSÃO ==========
router.get('/tempo-conversao/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const produto = await Produto.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
    
    const vendas = await Venda.find({ 'itens.produtoId': produtoId }).sort({ createdAt: 1 });
    
    let tempoMedio = 0;
    let tempoMedioVenda = 0;
    
    if (vendas.length >= 2) {
      const tempos = [];
      for (let i = 1; i < vendas.length; i++) {
        const diff = new Date(vendas[i].createdAt) - new Date(vendas[i-1].createdAt);
        tempos.push(diff / (1000 * 60 * 60 * 24)); // em dias
      }
      tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length;
      tempoMedioVenda = tempoMedio;
    }
    
    // Taxa de rotatividade de estoque
    const rotatividade = produto.quantidade > 0 
      ? (vendas.length / produto.quantidade) * 100 
      : 0;
    
    let classificacao = 'Normal';
    if (tempoMedio < 2) classificacao = 'Muito Rápido';
    else if (tempoMedio < 5) classificacao = 'Rápido';
    else if (tempoMedio < 14) classificacao = 'Normal';
    else if (tempoMedio < 30) classificacao = 'Lento';
    else classificacao = 'Muito Lento';
    
    res.json({
      success: true,
      produto: produto.nome,
      tempo_medio_conversao_dias: Number(tempoMedio.toFixed(1)),
      tempo_medio_entre_vendas_dias: Number(tempoMedioVenda.toFixed(1)),
      taxa_rotatividade_estoque: `${rotatividade.toFixed(1)}%`,
      classificacao,
      volume_estoque_dias: produto.quantidade > 0 ? (produto.quantidade / (vendas.length / 30)).toFixed(1) : 'N/A',
      recomendacoes: [
        tempoMedio > 30 ? 'Produto com baixa rotatividade. Considere promoções.' : 'Produto com boa saída.',
        rotatividade < 20 ? 'Aumentar visibilidade do produto.' : 'Manter estratégia atual.'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro no tempo de conversão:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 6. ESTRATÉGIA DE CONSERVAÇÃO ==========
router.get('/estrategia-conservacao/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const produto = await Produto.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
    
    const categoria = detectarCategoria(produto.nome);
    const estrategia = conhecimentoAgricola.conservacao[categoria] || conhecimentoAgricola.conservacao['legumes'];
    
    res.json({
      success: true,
      produto: produto.nome,
      categoria,
      conservacao: {
        temperatura: estrategia.temperatura,
        umidade: estrategia.umidade,
        metodo: estrategia.metodo,
        tempo_maximo: estrategia.tempo_maximo,
        dicas: estrategia.dicas
      },
      perdas_estimadas_sem_conservacao: '20-40%',
      perdas_estimadas_com_conservacao: '5-10%',
      economia_potencial: 'Até 30% de redução de perdas',
      investimento_sugerido: 'Sistema de refrigeração e embalagens adequadas',
      roi_estimado: 'Retorno em 3-6 meses',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro na estratégia de conservação:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 7. PLANEJAMENTO DE COLHEITA ==========
router.get('/planejamento-colheita/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const produto = await Produto.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
    
    const vendas = await Venda.find({ 'itens.produtoId': produtoId });
    
    // Análise de sazonalidade
    const vendasPorMes = {};
    vendas.forEach(venda => {
      const mes = new Date(venda.createdAt).getMonth();
      vendasPorMes[mes] = (vendasPorMes[mes] || 0) + 1;
    });
    
    // Meses de maior venda
    const mesesMaiorVenda = Object.entries(vendasPorMes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mes, qtd]) => ({
        mes: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(mes)],
        vendas: qtd
      }));
    
    // Planejamento
    const vendasMediaMensal = vendas.length / 12;
    const estoqueAtualDias = produto.quantidade / (vendasMediaMensal / 30);
    
    let acaoRecomendada = 'Manter produção atual';
    let periodoPlantio = 'Planejamento trimestral';
    let quantidadeSugerida = produto.quantidade;
    
    if (estoqueAtualDias < 15) {
      acaoRecomendada = 'URGENTE: Aumentar produção para atender demanda';
      quantidadeSugerida = produto.quantidade * 2;
      periodoPlantio = 'Iniciar plantio imediatamente';
    } else if (estoqueAtualDias < 30) {
      acaoRecomendada = 'Preparar próximo ciclo de plantio';
      quantidadeSugerida = produto.quantidade * 1.5;
      periodoPlantio = 'Próximas 2 semanas';
    } else if (estoqueAtualDias > 90) {
      acaoRecomendada = 'Reduzir produção ou buscar novos mercados';
      quantidadeSugerida = produto.quantidade * 0.7;
      periodoPlantio = 'Aguardar 2-3 meses';
    }
    
    res.json({
      success: true,
      produto: produto.nome,
      analise_colheita: {
        estoque_atual: `${produto.quantidade} ${produto.unidade || 'un'}`,
        autonomia_estoque_dias: Number(estoqueAtualDias.toFixed(1)),
        meses_maior_demanda: mesesMaiorVenda,
        vendas_media_mensal: Number(vendasMediaMensal.toFixed(1))
      },
      planejamento: {
        acao_recomendada: acaoRecomendada,
        periodo_plantio_sugerido: periodoPlantio,
        quantidade_sugerida_proximo_ciclo: quantidadeSugerida,
        melhor_epoca_venda: mesesMaiorVenda[0]?.mes || 'Ano todo'
      },
      alertas: estoqueAtualDias < 30 ? ['Estoque baixo, planejar próximo ciclo'] : [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro no planejamento de colheita:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 8. ANÁLISE FINANCEIRA ==========
router.get('/analise-financeira/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const produto = await Produto.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
    
    const vendas = await Venda.find({ 'itens.produtoId': produtoId });
    
    const receitaTotal = vendas.reduce((sum, venda) => {
      const item = venda.itens.find(i => i.produtoId.toString() === produtoId);
      return sum + (item?.valorTotal || 0);
    }, 0);
    
    const quantidadeVendida = vendas.reduce((sum, venda) => {
      const item = venda.itens.find(i => i.produtoId.toString() === produtoId);
      return sum + (item?.quantidade || 0);
    }, 0);
    
    const precoMedio = quantidadeVendida > 0 ? receitaTotal / quantidadeVendida : produto.preco;
    
    // Custos estimados (produção, transporte, armazenamento)
    const custoProducao = produto.preco * 0.4;
    const custoTransporte = produto.preco * 0.1;
    const custoArmazenamento = produto.preco * 0.05;
    const comissao = produto.preco * 0.005;
    
    const custoTotalUnitario = custoProducao + custoTransporte + custoArmazenamento + comissao;
    const lucroUnitario = produto.preco - custoTotalUnitario;
    const margemLucro = (lucroUnitario / produto.preco) * 100;
    
    const lucroTotalEstimado = lucroUnitario * (produto.quantidade + quantidadeVendida);
    
    res.json({
      success: true,
      produto: produto.nome,
      receita: {
        total_gerado: receitaTotal,
        quantidade_vendida: quantidadeVendida,
        preco_medio_venda: precoMedio
      },
      custos: {
        producao_unitario: custoProducao,
        transporte_unitario: custoTransporte,
        armazenamento_unitario: custoArmazenamento,
        comissao_plataforma: comissao,
        custo_total_unitario: custoTotalUnitario
      },
      lucratividade: {
        lucro_unitario: lucroUnitario,
        margem_lucro: `${margemLucro.toFixed(1)}%`,
        lucro_total_estimado: lucroTotalEstimado,
        ponto_equilibrio_unidades: Math.ceil(custoProducao / lucroUnitario),
        roi_estimado: `${(margemLucro * 2).toFixed(1)}%`
      },
      recomendacoes_financeiras: [
        margemLucro < 20 ? 'Margem baixa. Revisar custos ou aumentar preço.' : 'Margem saudável.',
        'Manter controle rigoroso de custos de produção',
        'Considerar venda direta para aumentar margem'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro na análise financeira:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 9. TENDÊNCIAS DE MERCADO ==========
router.get('/tendencias/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const produto = await Produto.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
    
    const categoria = detectarCategoria(produto.nome);
    const vendas = await Venda.find({ 'itens.produtoId': produtoId }).sort({ createdAt: 1 });
    
    // Análise de tendência
    let tendencia = 'Estável';
    let crescimentoPercentual = 0;
    
    if (vendas.length >= 6) {
      const primeiroTrimestre = vendas.slice(0, Math.floor(vendas.length / 2)).length;
      const ultimoTrimestre = vendas.slice(Math.floor(vendas.length / 2)).length;
      
      if (ultimoTrimestre > primeiroTrimestre) {
        tendencia = 'Crescimento';
        crescimentoPercentual = ((ultimoTrimestre - primeiroTrimestre) / primeiroTrimestre) * 100;
      } else if (ultimoTrimestre < primeiroTrimestre) {
        tendencia = 'Queda';
        crescimentoPercentual = ((primeiroTrimestre - ultimoTrimestre) / primeiroTrimestre) * 100;
      }
    }
    
    // Sazonalidade
    const vendasPorMes = {};
    vendas.forEach(venda => {
      const mes = new Date(venda.createdAt).getMonth();
      vendasPorMes[mes] = (vendasPorMes[mes] || 0) + 1;
    });
    
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const sazonalidade = mesesNomes.map((mes, idx) => ({
      mes,
      vendas: vendasPorMes[idx] || 0
    }));
    
    // Projeção de preço
    const precos = vendas.map(v => {
      const item = v.itens.find(i => i.produtoId.toString() === produtoId);
      return item ? item.valorTotal / item.quantidade : null;
    }).filter(p => p !== null);
    
    let projecaoPreco = produto.preco;
    if (precos.length > 0) {
      const mediaPrecos = precos.reduce((a, b) => a + b, 0) / precos.length;
      const ultimoPreco = precos[precos.length - 1];
      const variacao = (ultimoPreco - mediaPrecos) / mediaPrecos;
      projecaoPreco = ultimoPreco * (1 + variacao * 0.5);
    }
    
    res.json({
      success: true,
      produto: produto.nome,
      categoria,
      tendencia_geral: {
        direcao: tendencia,
        crescimento_percentual: crescimentoPercentual.toFixed(1),
        periodo_analisado: `${vendas.length} vendas`
      },
      sazonalidade: {
        meses_maior_venda: sazonalidade.filter(s => s.vendas > 0).sort((a, b) => b.vendas - a.vendas).slice(0, 3),
        meses_menor_venda: sazonalidade.filter(s => s.vendas > 0).sort((a, b) => a.vendas - b.vendas).slice(0, 3),
        dados_completos: sazonalidade
      },
      projecao_preco: {
        atual: produto.preco,
        projetado_3meses: projecaoPreco * (1 + crescimentoPercentual / 100),
        projetado_6meses: projecaoPreco * (1 + crescimentoPercentual / 50),
        fator_confianca: vendas.length > 50 ? 'Alto' : vendas.length > 20 ? 'Médio' : 'Baixo'
      },
      oportunidade_mercado: tendencia === 'Crescimento' 
        ? 'Momento favorável para expansão' 
        : 'Consolidar mercado antes de expandir',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro nas tendências:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 10. RELATÓRIO COMPLETO ==========
router.get('/relatorio-completo/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    // Executar todas as análises em paralelo
    const [
      analise,
      previsao,
      procura,
      precoIdeal,
      tempoConversao,
      conservacao,
      planejamento,
      financeiro,
      tendencias
    ] = await Promise.all([
      fetchAnalysis(`${req.protocol}://${req.get('host')}/api/jiam/analise-produto/${produtoId}`),
      fetchAnalysis(`${req.protocol}://${req.get('host')}/api/jiam/previsao-mercado`, 'POST', { produtoId }),
      fetchAnalysis(`${req.protocol}://${req.get('host')}/api/jiam/mapa-procura/${produtoId}`),
      fetchAnalysis(`${req.protocol}://${req.get('host')}/api/jiam/preco-ideal/${produtoId}`),
      fetchAnalysis(`${req.protocol}://${req.get('host')}/api/jiam/tempo-conversao/${produtoId}`),
      fetchAnalysis(`${req.protocol}://${req.get('host')}/api/jiam/estrategia-conservacao/${produtoId}`),
      fetchAnalysis(`${req.protocol}://${req.get('host')}/api/jiam/planejamento-colheita/${produtoId}`),
      fetchAnalysis(`${req.protocol}://${req.get('host')}/api/jiam/analise-financeira/${produtoId}`),
      fetchAnalysis(`${req.protocol}://${req.get('host')}/api/jiam/tendencias/${produtoId}`)
    ]);
    
    // Resumo executivo
    const resumoExecutivo = {
      produto: analise?.produto?.nome || 'Produto',
      saude_geral: calcularSaudeGeral(financeiro, tendencias, planejamento),
      recomendacao_principal: gerarRecomendacaoPrincipal(financeiro, tendencias, planejamento),
      acoes_imediatas: gerarAcoesImediatas(planejamento, tempoConversao, financeiro)
    };
    
    res.json({
      success: true,
      resumo_executivo: resumoExecutivo,
      analises: {
        analise_produto: analise,
        previsao_mercado: previsao,
        mapa_procura: procura,
        preco_ideal: precoIdeal,
        tempo_conversao: tempoConversao,
        estrategia_conservacao: conservacao,
        planejamento_colheita: planejamento,
        analise_financeira: financeiro,
        tendencias_mercado: tendencias
      },
      relatorio_gerado_em: new Date().toISOString(),
      exportavel: true
    });
    
  } catch (error) {
    console.error('Erro no relatório completo:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Funções auxiliares
async function fetchAnalysis(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    const data = await response.json();
    return data.success ? data : null;
  } catch (error) {
    console.error(`Erro na requisição para ${url}:`, error);
    return null;
  }
}

function calcularSaudeGeral(financeiro, tendencias, planejamento) {
  let pontuacao = 0;
  
  if (financeiro?.lucratividade?.margem_lucro) {
    const margem = parseFloat(financeiro.lucratividade.margem_lucro);
    if (margem > 30) pontuacao += 40;
    else if (margem > 20) pontuacao += 30;
    else if (margem > 10) pontuacao += 20;
    else pontuacao += 10;
  }
  
  if (tendencias?.tendencia_geral?.direcao === 'Crescimento') pontuacao += 30;
  else if (tendencias?.tendencia_geral?.direcao === 'Estável') pontuacao += 20;
  
  if (planejamento?.analise_colheita?.autonomia_estoque_dias > 30) pontuacao += 30;
  else if (planejamento?.analise_colheita?.autonomia_estoque_dias > 15) pontuacao += 15;
  
  if (pontuacao >= 80) return 'Excelente';
  if (pontuacao >= 60) return 'Boa';
  if (pontuacao >= 40) return 'Regular';
  return 'Atenção necessária';
}

function gerarRecomendacaoPrincipal(financeiro, tendencias, planejamento) {
  if (planejamento?.analise_colheita?.autonomia_estoque_dias < 15) {
    return '🚨 URGENTE: Estoque crítico. Aumentar produção imediatamente.';
  }
  
  const margem = financeiro?.lucratividade?.margem_lucro ? parseFloat(financeiro.lucratividade.margem_lucro) : 0;
  if (margem < 15) {
    return '📉 Margem baixa. Revisar custos ou reajustar preço.';
  }
  
  if (tendencias?.tendencia_geral?.direcao === 'Crescimento') {
    return '📈 Mercado em expansão! Aumentar produção e investir em marketing.';
  }
  
  return '✅ Manter estratégia atual e monitorar indicadores.';
}

function gerarAcoesImediatas(planejamento, tempoConversao, financeiro) {
  const acoes = [];
  
  if (planejamento?.planejamento?.acao_recomendada) {
    acoes.push(planejamento.planejamento.acao_recomendada);
  }
  
  if (tempoConversao?.classificacao === 'Muito Lento') {
    acoes.push('⏰ Produto com vendas lentas - considere promoções');
  }
  
  if (financeiro?.lucratividade?.margem_lucro) {
    const margem = parseFloat(financeiro.lucratividade.margem_lucro);
    if (margem < 15) {
      acoes.push('💰 Margem baixa - revisar estrutura de custos');
    }
  }
  
  return acoes.slice(0, 3);
}

// ========== 11. PREVISÃO SAZONAL ==========
router.get('/previsao-sazonal/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const vendas = await Venda.find({ 'itens.produtoId': produtoId });
    
    const vendasPorMes = {};
    for (let i = 0; i < 12; i++) vendasPorMes[i] = 0;
    
    vendas.forEach(venda => {
      const mes = new Date(venda.createdAt).getMonth();
      const item = venda.itens.find(i => i.produtoId.toString() === produtoId);
      if (item) vendasPorMes[mes] += item.quantidade;
    });
    
    const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const previsaoSazonal = mesesNomes.map((mes, idx) => ({
      mes,
      previsao_vendas: Math.round(vendasPorMes[idx] * 1.1),
      fator_sazonal: vendasPorMes[idx] > 0 ? (vendasPorMes[idx] / (vendas.length / 12)).toFixed(2) : 0.5
    }));
    
    const altaTemporada = previsaoSazonal.sort((a, b) => b.previsao_vendas - a.previsao_vendas).slice(0, 3);
    const baixaTemporada = previsaoSazonal.sort((a, b) => a.previsao_vendas - b.previsao_vendas).slice(0, 3);
    
    res.json({
      success: true,
      previsao_sazonal: previsaoSazonal,
      alta_temporada: altaTemporada,
      baixa_temporada: baixaTemporada,
      recomendacao: `Prepare maior produção para ${altaTemporada[0]?.mes} e planeje estoque para ${baixaTemporada[0]?.mes}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro na previsão sazonal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 12. COMPETITIVIDADE ==========
router.get('/competitividade/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const produto = await Produto.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
    
    // Produtos similares na mesma região
    const similares = await Produto.find({
      categoria: produto.categoria,
      provincia: produto.provincia,
      _id: { $ne: produtoId }
    }).limit(5);
    
    const precoMedioConcorrentes = similares.length > 0
      ? similares.reduce((a, b) => a + b.preco, 0) / similares.length
      : produto.preco * 1.1;
    
    const posicaoCompetitiva = produto.preco <= precoMedioConcorrentes ? 'Competitivo' : 'Menos competitivo';
    
    res.json({
      success: true,
      produto: produto.nome,
      concorrentes_encontrados: similares.length,
      preco_medio_concorrentes: precoMedioConcorrentes,
      seu_preco: produto.preco,
      posicao_competitiva: posicaoCompetitiva,
      vantagem: produto.preco <= precoMedioConcorrentes 
        ? 'Preço competitivo no mercado local' 
        : 'Necessário revisar preço ou agregar valor',
      sugestao: produto.preco > precoMedioConcorrentes * 1.2
        ? 'Considere reduzir preço para se manter competitivo'
        : 'Mantenha a estratégia atual',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro na análise de competitividade:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;