import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, MicOff, Volume2, VolumeX, TrendingUp, TrendingDown, Minus, HelpCircle, X, Send, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AbaPrevisoesAgro({ usuario }) {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [analise, setAnalise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [relatorio, setRelatorio] = useState(null);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagensChat, setMensagensChat] = useState([
    { remetente: 'ia', texto: '👋 Olá! Sou a assistente IA do JIAM. Posso ajudar com análises de mercado, preços ideais, concorrentes, planejamento de colheita e redução de custos. Como posso ajudar hoje?' }
  ]);
  const [inputChat, setInputChat] = useState('');
  const [reconhecimentoAtivo, setReconhecimentoAtivo] = useState(false);
  const [vozAtiva, setVozAtiva] = useState(true);
  const recognitionRef = useRef(null);
  const chatRef = useRef(null);

  const abas = [
    { id: 'resumo', nome: '📊 Resumo Executivo' },
    { id: 'mercado', nome: '📈 Mercado' },
    { id: 'preco', nome: '💰 Preço' },
    { id: 'financeiro', nome: '💵 Financeiro' },
    { id: 'colheita', nome: '🌾 Colheita' },
    { id: 'conservacao', nome: '❄️ Conservação' },
    { id: 'concorrentes', nome: '🏪 Concorrentes' },
    { id: 'custos', nome: '📉 Custos' }
  ];

  // Função para exportar relatório em PDF profissional
  const gerarRelatorioPDF = async () => {
    if (!analise || !produtoSelecionado) {
      alert('Nenhuma análise disponível para exportar');
      return;
    }

    try {
      const doc = new jsPDF();
      const dataAgora = new Date();
      const numeroRelatorio = `JIAM${dataAgora.getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // === CABEÇALHO ===
      doc.setFontSize(20);
      doc.setTextColor(34, 197, 94);
      doc.text("🌾 JIAM Preditivo", 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Relatório de Análise de Mercado e Previsões", 105, 30, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Relatório Nº: ${numeroRelatorio}`, 10, 45);
      doc.text(`Data: ${dataAgora.toLocaleDateString()} | Hora: ${dataAgora.toLocaleTimeString()}`, 10, 50);
      doc.text(`Emitido por: ${usuario?.nome || 'Sistema JIAM'}`, 10, 55);
      doc.text(`Email: ${usuario?.email || 'jiampreditivo@mercadoyangue.co.ao'}`, 10, 60);

      // === INFORMAÇÕES DO PRODUTO ===
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("📦 Informações do Produto", 14, 75);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Produto: ${produtoSelecionado?.nome || 'N/A'}`, 14, 85);
      doc.text(`Categoria: ${analise.produto?.categoria || detectarCategoria(produtoSelecionado?.nome) || 'N/A'}`, 14, 92);
      doc.text(`Província: ${produtoSelecionado?.provincia || 'N/A'}`, 14, 99);
      doc.text(`Preço Atual: Kz ${(analise.preco?.preco_atual || 0).toLocaleString()}`, 14, 106);
      doc.text(`Quantidade em Estoque: ${produtoSelecionado?.quantidade || 0} ${produtoSelecionado?.unidade || 'un'}`, 14, 113);

      // === RESUMO EXECUTIVO ===
      let yPos = 125;
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("📋 Resumo Executivo", 14, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const resumoTexto = analise.resumo?.recomendacao_principal || 'Análise concluída com sucesso.';
      const linhasResumo = doc.splitTextToSize(resumoTexto, 180);
      doc.text(linhasResumo, 14, yPos);
      yPos += (linhasResumo.length * 6) + 8;

      // Saúde do produto
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Saúde do Produto: ${analise.resumo?.saude_geral || 'Em análise'}`, 14, yPos);
      yPos += 8;
      
      // Ações Imediatas
      doc.setTextColor(34, 197, 94);
      doc.text("🎯 Ações Imediatas:", 14, yPos);
      yPos += 6;
      doc.setTextColor(0, 0, 0);
      const acoes = analise.resumo?.acoes_imediatas || ['Monitorar desempenho do produto'];
      acoes.forEach((acao, idx) => {
        doc.text(`• ${acao}`, 18, yPos + (idx * 6));
      });
      yPos += (acoes.length * 6) + 8;

      // === CARDS DE INDICADORES ===
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("📊 Indicadores de Desempenho", 14, yPos);
      yPos += 10;
      
      // Grid de indicadores
      const indicadores = [
        { label: "Demanda Mensal", value: `${analise.mercado?.demanda_estimada_mensal || 0} un` },
        { label: "Tendência", value: analise.mercado?.tendencia || 'Estável' },
        { label: "Melhor Época", value: analise.mercado?.melhor_epoca || 'Ano todo' },
        { label: "Preço Ideal", value: `Kz ${(analise.preco?.preco_ideal_sugerido || 0).toLocaleString()}` },
        { label: "Margem Sugerida", value: `${analise.financeiro?.margem_sugerida || 0}%` },
        { label: "Concorrentes", value: `${analise.mercado?.produtos_similares || 0}` }
      ];
      
      let col = 0;
      indicadores.forEach((ind, idx) => {
        const xPos = 14 + (col * 95);
        doc.setFillColor(240, 250, 240);
        doc.rect(xPos, yPos - 5, 85, 25, 'F');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(ind.label, xPos + 5, yPos + 2);
        doc.setFontSize(11);
        doc.setTextColor(34, 197, 94);
        doc.text(ind.value, xPos + 5, yPos + 12);
        col++;
        if (col >= 2) {
          col = 0;
          yPos += 28;
        }
      });
      yPos += 30;

      // === ANÁLISE DE PREÇO ===
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("💰 Análise de Preço", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Preço Atual: Kz ${(analise.preco?.preco_atual || 0).toLocaleString()}`, 14, yPos);
      doc.text(`Preço Médio Mercado: Kz ${(analise.preco?.preco_medio_mercado || 0).toLocaleString()}`, 14, yPos + 6);
      doc.text(`Preço Ideal Sugerido: Kz ${(analise.preco?.preco_ideal_sugerido || 0).toLocaleString()}`, 14, yPos + 12);
      doc.text(`Posicionamento: ${analise.preco?.posicionamento || 'Neutro'}`, 14, yPos + 18);
      doc.setTextColor(200, 150, 0);
      doc.text(`Recomendação: ${analise.preco?.recomendacao || 'Manter estratégia atual'}`, 14, yPos + 26);
      yPos += 40;

      // === ANÁLISE FINANCEIRA ===
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("💵 Análise Financeira", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const receitaMensal = (analise.mercado?.demanda_estimada_mensal || 0) * (analise.preco?.preco_ideal_sugerido || 0);
      const lucroMensal = (analise.financeiro?.lucro_estimado_unitario || 0) * (analise.mercado?.demanda_estimada_mensal || 0);
      
      doc.text(`Receita Potencial Mensal: Kz ${receitaMensal.toLocaleString()}`, 14, yPos);
      doc.text(`Lucro Estimado Unitário: Kz ${(analise.financeiro?.lucro_estimado_unitario || 0).toLocaleString()}`, 14, yPos + 6);
      doc.text(`Margem Sugerida: ${analise.financeiro?.margem_sugerida || 0}%`, 14, yPos + 12);
      doc.text(`Lucro Mensal Estimado: Kz ${lucroMensal.toLocaleString()}`, 14, yPos + 18);
      doc.text(`ROI Estimado: ${(analise.financeiro?.margem_sugerida || 0) * 1.5}%`, 14, yPos + 24);
      yPos += 38;

      // === PLANEJAMENTO DE COLHEITA ===
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("🌾 Planejamento de Colheita", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Estoque Atual: ${analise.colheita?.estoque_atual || 'N/A'}`, 14, yPos);
      doc.text(`Autonomia de Estoque: ${analise.colheita?.autonomia_estoque_dias || 0} dias`, 14, yPos + 6);
      doc.setTextColor(200, 150, 0);
      doc.text(`Ação Recomendada: ${analise.colheita?.acao_recomendada || 'Monitorar estoque'}`, 14, yPos + 12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Período de Plantio Sugerido: ${analise.colheita?.periodo_plantio_sugerido || 'Planejar conforme demanda'}`, 14, yPos + 18);
      yPos += 32;

      // === ESTRATÉGIA DE CONSERVAÇÃO ===
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("❄️ Estratégia de Conservação", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Temperatura Ideal: ${analise.conservacao?.temperatura || 'N/A'}`, 14, yPos);
      doc.text(`Umidade Ideal: ${analise.conservacao?.umidade || 'N/A'}`, 14, yPos + 6);
      doc.text(`Método Recomendado: ${analise.conservacao?.metodo || 'N/A'}`, 14, yPos + 12);
      doc.text(`Vida Útil Máxima: ${analise.conservacao?.tempo_maximo || 'N/A'}`, 14, yPos + 18);
      yPos += 28;

      // === QR Code ===
      const qrText = `https://mercadoyangue.co.ao/jiam/relatorio/${numeroRelatorio}`;
      const qrDataURL = await QRCode.toDataURL(qrText);
      doc.addImage(qrDataURL, 'PNG', 160, yPos - 15, 35, 35);

      // === RODAPÉ ===
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Este relatório foi gerado automaticamente pelo sistema JIAM Preditivo do Mercado Yangue.", 105, 280, { align: 'center' });
      doc.text(`© ${new Date().getFullYear()} Mercado Yangue - Todos os direitos reservados.`, 105, 287, { align: 'center' });

      // Salvar PDF
      doc.save(`relatorio_jiam_${produtoSelecionado?.nome}_${numeroRelatorio}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar relatório PDF. Tente novamente.');
    }
  };

  // Inicializar reconhecimento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-PT';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const texto = event.results[0][0].transcript;
        setInputChat(texto);
        enviarMensagemIA(texto);
        setReconhecimentoAtivo(false);
      };

      recognitionRef.current.onerror = () => {
        setReconhecimentoAtivo(false);
      };
    }
  }, []);

  // Falar texto
  const falar = (texto) => {
    if (!vozAtiva) return;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'pt-PT';
      utterance.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const iniciarReconhecimento = () => {
    if (recognitionRef.current) {
      setReconhecimentoAtivo(true);
      recognitionRef.current.start();
    } else {
      alert('Seu navegador não suporta reconhecimento de voz');
    }
  };

  const enviarMensagemIA = async (mensagem) => {
    if (!mensagem.trim()) return;

    setMensagensChat(prev => [...prev, { remetente: 'user', texto: mensagem }]);
    setInputChat('');

    try {
      const response = await axios.post(`${API_URL}/chatbot/ia`, {
        mensagem: mensagem,
        produto: produtoSelecionado,
        analise: analise,
        contexto: 'jiam_previsoes'
      });

      const respostaIA = response.data.resposta || gerarRespostaLocal(mensagem);
      setMensagensChat(prev => [...prev, { remetente: 'ia', texto: respostaIA }]);
      falar(respostaIA);
    } catch (error) {
      const respostaLocal = gerarRespostaLocal(mensagem);
      setMensagensChat(prev => [...prev, { remetente: 'ia', texto: respostaLocal }]);
      falar(respostaLocal);
    }
  };

  const gerarRespostaLocal = (pergunta) => {
    const perguntaLower = pergunta.toLowerCase();
    
    if (perguntaLower.includes('preço') || perguntaLower.includes('valor')) {
      return `💰 O preço atual do ${produtoSelecionado?.nome || 'produto'} é Kz ${analise?.preco?.preco_atual?.toLocaleString() || 'não definido'}. O preço ideal sugerido é Kz ${analise?.preco?.preco_ideal_sugerido?.toLocaleString() || 'não disponível'}. Recomendo ${analise?.preco?.recomendacao || 'manter o preço atual'}.`;
    }
    
    if (perguntaLower.includes('mercado') || perguntaLower.includes('demanda')) {
      return `📈 A demanda mensal estimada é ${analise?.mercado?.demanda_estimada_mensal || 0} unidades. A tendência é de ${analise?.mercado?.tendencia || 'estabilidade'}. As melhores regiões para venda são ${analise?.mercado?.concorrentes?.slice(0, 2).map(c => c.vendedor).join(' e ') || 'não identificadas'}.`;
    }
    
    if (perguntaLower.includes('colheita') || perguntaLower.includes('plantar')) {
      return `🌾 O estoque atual tem autonomia de ${analise?.colheita?.autonomia_estoque_dias || 0} dias. Recomendo ${analise?.colheita?.acao_recomendada || 'manter o planejamento atual'}. O período ideal para próximo plantio é ${analise?.colheita?.periodo_plantio_sugerido || 'planejar conforme demanda'}.`;
    }
    
    if (perguntaLower.includes('custo') || perguntaLower.includes('gasto')) {
      return `📉 O custo unitário é Kz ${(analise?.financeiro?.custo_estimado_producao || 0).toLocaleString()}. A margem de lucro é ${analise?.financeiro?.margem_sugerida || 0}%. Para reduzir custos, sugiro otimizar transporte e armazenamento.`;
    }
    
    return `📊 Posso ajudar com análises de preço, mercado, colheita, custos e concorrentes. Pergunte sobre: preço, demanda, colheita, custo, mercado, concorrência ou conservação.`;
  };

  const analisarProduto = async (produtoId) => {
    setLoading(true);
    try {
      const produto = produtos.find(p => p._id === produtoId);
      setProdutoSelecionado(produto);

      const analiseMercado = await realizarAnaliseInteligente(produto);
      setAnalise(analiseMercado);
      setRelatorio({ analises: analiseMercado, resumo_executivo: analiseMercado.resumo });
      
      falar(`Análise do produto ${produto.nome} concluída. ${analiseMercado.resumo?.recomendacao_principal || 'Consulte os detalhes para mais informações.'}`);
    } catch (error) {
      console.error('Erro na análise:', error);
      const analiseCompensatoria = gerarAnaliseCompensatoria(produtoSelecionado);
      setAnalise(analiseCompensatoria);
    } finally {
      setLoading(false);
    }
  };

  const realizarAnaliseInteligente = async (produto) => {
    const similares = produtos.filter(p => 
      p.categoria === produto.categoria && 
      p._id !== produto._id &&
      p.provincia === produto.provincia
    );
    
    const precosSimilares = similares.map(p => p.preco);
    const precoMedioMercado = precosSimilares.length > 0 
      ? precosSimilares.reduce((a, b) => a + b, 0) / precosSimilares.length 
      : produto.preco * 1.15;
    
    const precoIdeal = produto.preco > precoMedioMercado 
      ? precoMedioMercado 
      : produto.preco * 0.95;
    
    let posicionamento = 'Neutro';
    let recomendacaoPreco = 'Manter preço atual';
    
    if (produto.preco > precoMedioMercado * 1.2) {
      posicionamento = 'Premium';
      recomendacaoPreco = 'Preço acima do mercado. Considere reduzir para aumentar competitividade.';
    } else if (produto.preco < precoMedioMercado * 0.8) {
      posicionamento = 'Competitivo';
      recomendacaoPreco = 'Preço atraente! Considere aumentar gradualmente.';
    }
    
    const demandaBase = calcularDemandaEstimada(produto, precoMedioMercado);
    const margemSugerida = produto.preco > precoMedioMercado ? 35 : 25;
    
    return {
      produto: {
        id: produto._id,
        nome: produto.nome,
        categoria: produto.categoria || detectarCategoria(produto.nome),
        preco_atual: produto.preco,
        provincia: produto.provincia
      },
      mercado: {
        produtos_similares: similares.length,
        preco_medio_mercado: precoMedioMercado,
        demanda_estimada_mensal: demandaBase.demanda,
        tendencia: demandaBase.tendencia,
        melhor_epoca: demandaBase.melhorEpoca,
        concorrentes: similares.map(s => ({ nome: s.nome, preco: s.preco, vendedor: s.vendedor?.nome }))
      },
      preco: {
        preco_atual: produto.preco,
        preco_medio_mercado: precoMedioMercado,
        preco_ideal_sugerido: Math.round(precoIdeal),
        posicionamento,
        recomendacao: recomendacaoPreco
      },
      financeiro: {
        custo_estimado_producao: produto.preco * 0.4,
        custo_transporte: produto.preco * 0.1,
        custo_armazenamento: produto.preco * 0.05,
        margem_sugerida: margemSugerida,
        lucro_estimado_unitario: produto.preco - (produto.preco * 0.55)
      },
      colheita: {
        autonomia_estoque_dias: produto.quantidade > 0 ? Math.floor(produto.quantidade / (demandaBase.demanda / 30)) : 0,
        estoque_atual: `${produto.quantidade} ${produto.unidade || 'un'}`,
        acao_recomendada: produto.quantidade < demandaBase.demanda / 2 
          ? 'Estoque baixo! Planejar próximo ciclo de produção' 
          : 'Estoque adequado',
        periodo_plantio_sugerido: demandaBase.melhorEpoca === 'alta' 
          ? 'Iniciar plantio imediatamente' 
          : 'Planejar para próxima safra'
      },
      conservacao: obterEstrategiaConservacao(produto.nome),
      resumo: {
        saude_geral: calcularSaudeGeral(produto, demandaBase, precoMedioMercado),
        recomendacao_principal: gerarRecomendacao(produto, demandaBase, precoMedioMercado),
        acoes_imediatas: gerarAcoes(produto, demandaBase, precoMedioMercado)
      }
    };
  };

  const detectarCategoria = (nome) => {
    const nomeLower = nome.toLowerCase();
    if (nomeLower.includes('feijão') || nomeLower.includes('milho') || nomeLower.includes('arroz')) return 'grãos';
    if (nomeLower.includes('batata') || nomeLower.includes('mandioca')) return 'raízes';
    if (nomeLower.includes('banana') || nomeLower.includes('manga') || nomeLower.includes('laranja')) return 'frutas';
    if (nomeLower.includes('tomate') || nomeLower.includes('cebola') || nomeLower.includes('alface')) return 'legumes';
    return 'diversos';
  };

  const calcularDemandaEstimada = (produto, precoMedio) => {
    const fatorPreco = produto.preco <= precoMedio ? 1.2 : 0.8;
    const fatorEstoque = produto.quantidade > 100 ? 1.5 : produto.quantidade > 50 ? 1.2 : 1;
    const fatorRegiao = produto.provincia === 'Luanda' ? 2 : produto.provincia === 'Benguela' ? 1.5 : 1;
    
    const demandaBase = Math.round(50 * fatorPreco * fatorEstoque * fatorRegiao);
    
    let tendencia = 'estável';
    let melhorEpoca = 'ano todo';
    
    if (produto.nome.toLowerCase().includes('milho')) {
      tendencia = 'crescimento';
      melhorEpoca = 'maio a agosto';
    } else if (produto.nome.toLowerCase().includes('batata')) {
      tendencia = 'crescimento';
      melhorEpoca = 'junho a setembro';
    }
    
    return { demanda: demandaBase, tendencia, melhorEpoca };
  };

  const calcularSaudeGeral = (produto, demanda, precoMedio) => {
    let pontuacao = 0;
    if (produto.preco <= precoMedio) pontuacao += 30;
    if (demanda.demanda > 30) pontuacao += 30;
    if (produto.quantidade > 50) pontuacao += 20;
    if (demanda.tendencia === 'crescimento') pontuacao += 20;
    
    if (pontuacao >= 70) return 'Excelente';
    if (pontuacao >= 50) return 'Boa';
    if (pontuacao >= 30) return 'Regular';
    return 'Atenção necessária';
  };

  const gerarRecomendacao = (produto, demanda, precoMedio) => {
    if (produto.preco > precoMedio * 1.2) {
      return 'Preço elevado para o mercado. Reduza para aumentar vendas.';
    }
    if (produto.quantidade < demanda.demanda / 2) {
      return 'Estoque baixo! Planeje novo ciclo de produção.';
    }
    if (demanda.demanda > 50 && produto.preco <= precoMedio) {
      return 'Momento favorável para expansão! Aumente produção.';
    }
    return 'Produto saudável. Mantenha estratégia atual.';
  };

  const gerarAcoes = (produto, demanda, precoMedio) => {
    const acoes = [];
    if (produto.preco > precoMedio) acoes.push('💰 Revisar preço para maior competitividade');
    if (produto.quantidade < 30) acoes.push('🌾 Aumentar produção para atender demanda');
    if (demanda.demanda > 60) acoes.push('📈 Expandir para novas regiões');
    if (produto.preco <= precoMedio) acoes.push('📊 Manter estratégia atual');
    return acoes.slice(0, 3);
  };

  const obterEstrategiaConservacao = (nomeProduto) => {
    const categoria = detectarCategoria(nomeProduto);
    const estrategias = {
      'grãos': { temperatura: '15-20°C', umidade: '50-60%', metodo: 'Silos herméticos', tempo_maximo: '180-365 dias', dicas: ['Manter longe de umidade', 'Usar recipientes herméticos'] },
      'raízes': { temperatura: '12-18°C', umidade: '60-70%', metodo: 'Ambiente seco e escuro', tempo_maximo: '30-60 dias', dicas: ['Armazenar em local seco', 'Não lavar antes de guardar'] },
      'frutas': { temperatura: '8-12°C', umidade: '85-90%', metodo: 'Refrigeração', tempo_maximo: '7-14 dias', dicas: ['Não lavar antes de armazenar', 'Separar frutas que produzem etileno'] },
      'legumes': { temperatura: '4-8°C', umidade: '90-95%', metodo: 'Refrigeração com alta umidade', tempo_maximo: '5-10 dias', dicas: ['Remover folhas danificadas', 'Armazenar em sacos perfurados'] },
      'diversos': { temperatura: '10-15°C', umidade: '70-80%', metodo: 'Ambiente arejado', tempo_maximo: '15-30 dias', dicas: ['Conservar em local fresco', 'Evitar luz direta'] }
    };
    return estrategias[categoria] || estrategias['diversos'];
  };

  const gerarAnaliseCompensatoria = (produto) => {
    if (!produto) return null;
    return {
      produto: { nome: produto.nome, preco_atual: produto.preco, provincia: produto.provincia },
      mercado: { preco_medio_mercado: produto.preco * 1.15, demanda_estimada_mensal: 30, tendencia: 'em análise' },
      preco: { preco_atual: produto.preco, preco_ideal_sugerido: produto.preco * 0.95, recomendacao: 'Produto novo no mercado. Acompanhe primeiras vendas.' },
      financeiro: { margem_sugerida: 25, lucro_estimado_unitario: produto.preco * 0.25 },
      colheita: { autonomia_estoque_dias: 15, acao_recomendada: 'Monitorar vendas iniciais' },
      conservacao: obterEstrategiaConservacao(produto.nome),
      resumo: { saude_geral: 'Em análise', recomendacao_principal: 'Produto cadastrado recentemente. Acompanhar desempenho.', acoes_imediatas: ['Cadastrar mais produtos', 'Divulgar nas redes sociais', 'Oferecer amostras'] }
    };
  };

  const handleSelecionarProduto = (produtoId) => {
    const produto = produtos.find(p => p._id === produtoId);
    setProdutoSelecionado(produto);
    analisarProduto(produtoId);
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const response = await axios.get(`${API_URL}/produtos`);
      setProdutos(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensagensChat]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho com IA */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🌾</span>
            <div>
              <h1 className="text-3xl font-bold">JIAM Preditivo - Agronegócio</h1>
              <p className="text-green-100">Inteligência de dados para decisões estratégicas no campo angolano</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setVozAtiva(!vozAtiva)}
              className={`p-3 rounded-full transition ${vozAtiva ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
              title={vozAtiva ? 'Desativar voz' : 'Ativar voz'}
            >
              {vozAtiva ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
            <button
              onClick={() => setChatAberto(!chatAberto)}
              className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition"
              title="Assistente IA"
            >
              <HelpCircle size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Chatbot IA Flutuante */}
      {chatAberto && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-green-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-bold">Assistente JIAM IA</h3>
                <p className="text-xs opacity-90">Sempre online para ajudar</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={iniciarReconhecimento}
                className={`p-2 rounded-full transition ${reconhecimentoAtivo ? 'bg-red-500 animate-pulse' : 'bg-white/20 hover:bg-white/30'}`}
                title="Falar com IA"
              >
                {reconhecimentoAtivo ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button onClick={() => setChatAberto(false)} className="p-2 rounded-full hover:bg-white/20">
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div ref={chatRef} className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {mensagensChat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.remetente === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl ${msg.remetente === 'user' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{msg.remetente === 'user' ? '👤' : '🤖'}</span>
                    <span className="text-xs opacity-70">{msg.remetente === 'user' ? 'Você' : 'JIAM IA'}</span>
                  </div>
                  <p className="text-sm">{msg.texto}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && enviarMensagemIA(inputChat)}
              placeholder="Digite sua pergunta..."
              className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button
              onClick={iniciarReconhecimento}
              className={`p-2 rounded-lg transition ${reconhecimentoAtivo ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              <Mic size={18} />
            </button>
            <button
              onClick={() => enviarMensagemIA(inputChat)}
              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Seleção de Produto */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Selecione um Produto</h2>
        <select
          onChange={(e) => handleSelecionarProduto(e.target.value)}
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500"
          defaultValue=""
        >
          <option value="" disabled>Escolha um produto</option>
          {produtos.map(p => (
            <option key={p._id} value={p._id}>{p.nome} - {p.provincia} - {p.quantidade} {p.unidade || 'un'}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Analisando mercado e gerando previsões inteligentes...</p>
          <p className="text-sm text-gray-400">Coletando dados de concorrentes e tendências</p>
        </div>
      )}

      {/* Resultados */}
      {analise && !loading && (
        <>
          {/* Cards Rápidos */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-sm text-gray-500">Preço Ideal</div>
              <div className="font-bold text-green-700">Kz {analise.preco?.preco_ideal_sugerido?.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl mb-1">📈</div>
              <div className="text-sm text-gray-500">Demanda Mensal</div>
              <div className="font-bold text-blue-700">{analise.mercado?.demanda_estimada_mensal || 0} un</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-sm text-gray-500">Margem</div>
              <div className="font-bold text-purple-700">{analise.financeiro?.margem_sugerida || 0}%</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-sm text-gray-500">Concorrentes</div>
              <div className="font-bold text-orange-700">{analise.mercado?.produtos_similares || 0}</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl mb-1">
                {analise.resumo?.saude_geral === 'Excelente' ? '🌟' : 
                 analise.resumo?.saude_geral === 'Boa' ? '✅' : 
                 analise.resumo?.saude_geral === 'Regular' ? '⚠️' : '🔴'}
              </div>
              <div className="text-sm text-gray-500">Saúde</div>
              <div className="font-bold">{analise.resumo?.saude_geral || 'N/A'}</div>
            </div>
          </div>

          {/* Resumo Executivo */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
              <h2 className="text-2xl font-bold mb-3">📋 Resumo Executivo</h2>
              <p className="text-lg mb-2">
                <strong>Produto:</strong> {produtoSelecionado?.nome}
              </p>
              <p className="mb-2">
                <strong>Recomendação:</strong> 
                <span className="ml-2 font-semibold text-green-700">{analise.resumo?.recomendacao_principal}</span>
              </p>
              <div className="mt-4 p-4 bg-white rounded-lg">
                <strong className="flex items-center gap-2">🎯 Ações Imediatas</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {analise.resumo?.acoes_imediatas?.map((acao, idx) => (
                    <li key={idx} className="text-gray-700">{acao}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="flex flex-wrap gap-2 border-b pb-2 overflow-x-auto">
            {abas.map(aba => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                  abaAtiva === aba.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {aba.nome}
              </button>
            ))}
          </div>

          {/* Conteúdo das Abas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {abaAtiva === 'resumo' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold text-green-700 mb-2">📊 Indicadores Chave</h4>
                    <p><strong>Demanda mensal:</strong> {analise.mercado?.demanda_estimada_mensal || 0} unidades</p>
                    <p><strong>Tendência:</strong> {analise.mercado?.tendencia || 'Estável'}</p>
                    <p><strong>Melhor época:</strong> {analise.mercado?.melhor_epoca || 'Ano todo'}</p>
                    <p><strong>Preço competitivo:</strong> {analise.preco?.posicionamento || 'Neutro'}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold text-green-700 mb-2">📈 Projeções</h4>
                    <p><strong>Receita potencial:</strong> Kz {(analise.mercado?.demanda_estimada_mensal * analise.preco?.preco_ideal_sugerido).toLocaleString()}</p>
                    <p><strong>Lucro estimado:</strong> Kz {(analise.financeiro?.lucro_estimado_unitario * analise.mercado?.demanda_estimada_mensal).toLocaleString()}</p>
                    <p><strong>ROI estimado:</strong> {analise.financeiro?.margem_sugerida * 1.5}%</p>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'mercado' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">📊 Demanda e Tendência</h4>
                    <p><strong>Demanda mensal:</strong> {analise.mercado?.demanda_estimada_mensal || 0} unidades</p>
                    <p><strong>Tendência:</strong> 
                      <span className="ml-2">
                        {analise.mercado?.tendencia === 'crescimento' ? <TrendingUp className="inline text-green-600" size={18} /> :
                         analise.mercado?.tendencia === 'queda' ? <TrendingDown className="inline text-red-600" size={18} /> :
                         <Minus className="inline text-yellow-600" size={18} />}
                        {analise.mercado?.tendencia || 'Estável'}
                      </span>
                    </p>
                    <p><strong>Melhor época para venda:</strong> {analise.mercado?.melhor_epoca || 'Ano todo'}</p>
                    <p><strong>Produtos similares no mercado:</strong> {analise.mercado?.produtos_similares || 0}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">🏪 Concorrência</h4>
                    {analise.mercado?.concorrentes?.length > 0 ? (
                      analise.mercado.concorrentes.slice(0, 3).map((c, idx) => (
                        <div key={idx} className="mb-2 pb-2 border-b">
                          <p><strong>{c.nome}</strong></p>
                          <p className="text-sm text-gray-600">Preço: Kz {c.preco?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Vendedor: {c.vendedor || 'Anônimo'}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Nenhum concorrente direto identificado</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'concorrentes' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-700">🏪 Análise de Concorrência</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Posicionamento</h4>
                    <p><strong>Sua posição:</strong> {analise.preco?.posicionamento || 'Neutro'}</p>
                    <p><strong>Preço vs mercado:</strong> {analise.preco?.preco_atual > analise.preco?.preco_medio_mercado ? 'Acima da média' : 'Abaixo ou igual à média'}</p>
                    <p className="mt-2 text-sm text-yellow-700">{analise.preco?.recomendacao}</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h4 className="font-bold text-green-800 mb-2">💡 Estratégia Competitiva</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>{analise.preco?.preco_atual > analise.preco?.preco_medio_mercado ? 'Considere redução de preço para ganhar mercado' : 'Preço competitivo, foque em qualidade'}</li>
                      <li>Invista em marketing digital</li>
                      <li>Ofereça diferenciais como entrega rápida</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'custos' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-700">📉 Otimização de Custos</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Estrutura de Custos</h4>
                    <p><strong>Produção:</strong> Kz {analise.financeiro?.custo_estimado_producao?.toLocaleString()} ({Math.round((analise.financeiro?.custo_estimado_producao / analise.preco?.preco_atual) * 100)}%)</p>
                    <p><strong>Transporte:</strong> Kz {analise.financeiro?.custo_transporte?.toLocaleString()} ({Math.round((analise.financeiro?.custo_transporte / analise.preco?.preco_atual) * 100)}%)</p>
                    <p><strong>Armazenamento:</strong> Kz {analise.financeiro?.custo_armazenamento?.toLocaleString()}</p>
                    <p className="mt-2 font-bold">Custo Total: Kz {(analise.financeiro?.custo_estimado_producao + analise.financeiro?.custo_transporte + analise.financeiro?.custo_armazenamento).toLocaleString()}</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-red-50">
                    <h4 className="font-bold text-red-800 mb-2">💰 Oportunidades de Redução</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Otimize rotas de transporte para reduzir custos</li>
                      <li>Invista em embalagens adequadas para reduzir perdas</li>
                      <li>Negocie em volume para insumos</li>
                      <li>Considere armazenamento cooperativo</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'preco' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">💰 Análise de Preço</h4>
                    <p><strong>Preço atual:</strong> Kz {analise.preco?.preco_atual?.toLocaleString()}</p>
                    <p><strong>Preço médio mercado:</strong> Kz {analise.preco?.preco_medio_mercado?.toLocaleString()}</p>
                    <p><strong>Preço ideal sugerido:</strong> <span className="text-green-700 font-bold">Kz {analise.preco?.preco_ideal_sugerido?.toLocaleString()}</span></p>
                    <p className="mt-2 text-yellow-700">{analise.preco?.recomendacao}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">📊 Impacto da Mudança</h4>
                    {analise.preco?.preco_atual > analise.preco?.preco_ideal_sugerido ? (
                      <p>Reduzir preço pode aumentar vendas em até 30%</p>
                    ) : analise.preco?.preco_atual < analise.preco?.preco_ideal_sugerido ? (
                      <p>Aumentar preço pode melhorar margem em até 15%</p>
                    ) : (
                      <p>Preço otimizado, mantenha estratégia</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'financeiro' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">📊 Receita</h4>
                    <p><strong>Potencial mensal:</strong> Kz {(analise.mercado?.demanda_estimada_mensal * analise.preco?.preco_ideal_sugerido).toLocaleString()}</p>
                    <p><strong>Potencial anual:</strong> Kz {(analise.mercado?.demanda_estimada_mensal * 12 * analise.preco?.preco_ideal_sugerido).toLocaleString()}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">💵 Lucratividade</h4>
                    <p><strong>Lucro unitário:</strong> Kz {analise.financeiro?.lucro_estimado_unitario?.toLocaleString()}</p>
                    <p><strong>Margem sugerida:</strong> {analise.financeiro?.margem_sugerida}%</p>
                    <p><strong>Lucro mensal estimado:</strong> Kz {(analise.financeiro?.lucro_estimado_unitario * analise.mercado?.demanda_estimada_mensal).toLocaleString()}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">📈 ROI</h4>
                    <p><strong>Retorno sobre investimento:</strong> {analise.financeiro?.margem_sugerida * 1.5}%</p>
                    <p><strong>Tempo de retorno:</strong> ~{Math.ceil(12 / (analise.financeiro?.margem_sugerida / 100))} meses</p>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'colheita' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">🌾 Estoque</h4>
                    <p><strong>Atual:</strong> {analise.colheita?.estoque_atual}</p>
                    <p><strong>Autonomia:</strong> {analise.colheita?.autonomia_estoque_dias} dias</p>
                    <p className="mt-2 text-yellow-700">{analise.colheita?.acao_recomendada}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">📅 Planejamento</h4>
                    <p><strong>Período plantio:</strong> {analise.colheita?.periodo_plantio_sugerido}</p>
                    <p><strong>Previsão próxima safra:</strong> {analise.mercado?.melhor_epoca || 'A definir'}</p>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'conservacao' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">❄️ Condições Ideais</h4>
                    <p><strong>Temperatura:</strong> {analise.conservacao?.temperatura}</p>
                    <p><strong>Umidade:</strong> {analise.conservacao?.umidade}</p>
                    <p><strong>Método:</strong> {analise.conservacao?.metodo}</p>
                    <p><strong>Vida útil máxima:</strong> {analise.conservacao?.tempo_maximo}</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h4 className="font-bold text-green-800 mb-2">💡 Dicas de Conservação</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {analise.conservacao?.dicas?.map((dica, idx) => (
                        <li key={idx}>{dica}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão de Exportar Relatório PDF */}
          <div className="flex justify-end">
            <button
              onClick={gerarRelatorioPDF}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <FileText size={18} />
              Exportar Relatório PDF
            </button>
          </div>
        </>
      )}

      {!analise && !loading && produtos.length > 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <p className="text-gray-500">Selecione um produto para iniciar a análise inteligente</p>
          <p className="text-sm text-gray-400 mt-1">O JIAM analisa mercado, preços, concorrência e gera recomendações</p>
        </div>
      )}
    </div>
  );
}

export default AbaPrevisoesAgro;