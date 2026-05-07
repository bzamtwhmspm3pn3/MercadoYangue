import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Minus, FileText, Mic, MicOff, Volume2, VolumeX, HelpCircle, X, Send } from 'lucide-react';
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
    { remetente: 'ia', texto: 'Ola! Sou a assistente do JIAM Preditivo. Posso ajudar com analises de mercado, precos ideais, concorrentes, planejamento de colheita e reducao de custos. Como posso ajudar hoje?' }
  ]);
  const [inputChat, setInputChat] = useState('');
  const [reconhecimentoAtivo, setReconhecimentoAtivo] = useState(false);
  const [vozAtiva, setVozAtiva] = useState(true);
  const [ouvindo, setOuvindo] = useState(false);
  const recognitionRef = useRef(null);
  const chatRef = useRef(null);
  const synthesisRef = useRef(null);

  const abas = [
    { id: 'resumo', nome: 'Resumo Executivo' },
    { id: 'mercado', nome: 'Mercado' },
    { id: 'preco', nome: 'Preco' },
    { id: 'financeiro', nome: 'Financeiro' },
    { id: 'colheita', nome: 'Colheita' },
    { id: 'conservacao', nome: 'Conservacao' },
    { id: 'concorrentes', nome: 'Concorrentes' },
    { id: 'custos', nome: 'Custos' }
  ];

  // ==================== FUNCOES AUXILIARES ====================
  
  const limparTexto = (texto) => {
    if (!texto) return '';
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s,.]/g, '')
      .trim();
  };

  const limparTextoExibicao = (texto) => {
    if (!texto) return '';
    return texto.replace(/[^\w\sçãõáéíóúâêôÂÊÔÁÉÍÓÚÇÃÕ,.]/g, '');
  };

  const detectarCategoria = (nome) => {
    const nomeLower = nome.toLowerCase();
    if (nomeLower.includes('feijao') || nomeLower.includes('milho') || nomeLower.includes('arroz')) return 'graos';
    if (nomeLower.includes('batata') || nomeLower.includes('mandioca')) return 'raizes';
    if (nomeLower.includes('banana') || nomeLower.includes('manga') || nomeLower.includes('laranja')) return 'frutas';
    if (nomeLower.includes('tomate') || nomeLower.includes('cebola') || nomeLower.includes('alface')) return 'legumes';
    return 'diversos';
  };

  const obterEstrategiaConservacao = (nomeProduto) => {
    const categoria = detectarCategoria(nomeProduto);
    const estrategias = {
      'graos': { temperatura: '15-20C', umidade: '50-60%', metodo: 'Silos hermeticos', tempo_maximo: '180-365 dias', dicas: ['Manter longe de umidade', 'Usar recipientes hermeticos'] },
      'raizes': { temperatura: '12-18C', umidade: '60-70%', metodo: 'Ambiente seco e escuro', tempo_maximo: '30-60 dias', dicas: ['Armazenar em local seco', 'Nao lavar antes de guardar'] },
      'frutas': { temperatura: '8-12C', umidade: '85-90%', metodo: 'Refrigeracao', tempo_maximo: '7-14 dias', dicas: ['Nao lavar antes de armazenar', 'Separar frutas que produzem etileno'] },
      'legumes': { temperatura: '4-8C', umidade: '90-95%', metodo: 'Refrigeracao com alta umidade', tempo_maximo: '5-10 dias', dicas: ['Remover folhas danificadas', 'Armazenar em sacos perfurados'] },
      'diversos': { temperatura: '10-15C', umidade: '70-80%', metodo: 'Ambiente arejado', tempo_maximo: '15-30 dias', dicas: ['Conservar em local fresco', 'Evitar luz direta'] }
    };
    return estrategias[categoria] || estrategias['diversos'];
  };

  // ==================== ANALISE INTELIGENTE ====================
  
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
    let recomendacaoPreco = 'Manter preco atual';
    
    if (produto.preco > precoMedioMercado * 1.2) {
      posicionamento = 'Premium';
      recomendacaoPreco = 'Preco acima do mercado. Considere reduzir para aumentar competitividade.';
    } else if (produto.preco < precoMedioMercado * 0.8) {
      posicionamento = 'Competitivo';
      recomendacaoPreco = 'Preco atraente! Considere aumentar gradualmente.';
    }
    
    const fatorPreco = produto.preco <= precoMedioMercado ? 1.2 : 0.8;
    const fatorEstoque = produto.quantidade > 100 ? 1.5 : produto.quantidade > 50 ? 1.2 : 1;
    const fatorRegiao = produto.provincia === 'Luanda' ? 2 : produto.provincia === 'Benguela' ? 1.5 : 1;
    const demandaBase = Math.round(50 * fatorPreco * fatorEstoque * fatorRegiao);
    
    let tendencia = 'Estavel';
    if (produto.nome.toLowerCase().includes('milho') || produto.nome.toLowerCase().includes('batata')) {
      tendencia = 'Crescimento';
    }
    
    const margemSugerida = produto.preco > precoMedioMercado ? 35 : 25;
    const lucroUnitario = produto.preco - (produto.preco * 0.55);
    const autonomiaEstoque = produto.quantidade > 0 ? Math.floor(produto.quantidade / (demandaBase / 30)) : 0;
    
    let acaoRecomendada = 'Manter producao atual';
    if (autonomiaEstoque < 15) acaoRecomendada = 'URGENTE: Aumentar producao para atender demanda';
    else if (autonomiaEstoque < 30) acaoRecomendada = 'Preparar proximo ciclo de plantio';
    else if (autonomiaEstoque > 90) acaoRecomendada = 'Reduzir producao ou buscar novos mercados';
    
    let pontuacao = 0;
    if (produto.preco <= precoMedioMercado) pontuacao += 30;
    if (demandaBase > 30) pontuacao += 30;
    if (produto.quantidade > 50) pontuacao += 20;
    if (tendencia === 'Crescimento') pontuacao += 20;
    
    const saudeGeral = pontuacao >= 70 ? 'Excelente' : pontuacao >= 50 ? 'Boa' : pontuacao >= 30 ? 'Regular' : 'Atencao necessaria';
    
    let recomendacaoPrincipal = 'Produto saudavel. Manter estrategia atual.';
    if (produto.preco > precoMedioMercado * 1.2) recomendacaoPrincipal = 'Preco elevado para o mercado. Reduza para aumentar vendas.';
    else if (produto.quantidade < demandaBase / 2) recomendacaoPrincipal = 'Estoque baixo! Planeje novo ciclo de producao.';
    else if (demandaBase > 50 && produto.preco <= precoMedioMercado) recomendacaoPrincipal = 'Momento favoravel para expansao! Aumente producao.';
    
    const acoes = [];
    if (produto.preco > precoMedioMercado) acoes.push('Revisar preco para maior competitividade');
    if (produto.quantidade < 30) acoes.push('Aumentar producao para atender demanda');
    if (demandaBase > 60) acoes.push('Expandir para novas regioes');
    if (produto.preco <= precoMedioMercado) acoes.push('Manter estrategia atual');
    
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
        demanda_estimada_mensal: demandaBase,
        tendencia: tendencia,
        melhor_epoca: 'ano todo',
        concorrentes: similares.slice(0, 5).map(s => ({ nome: s.nome, preco: s.preco, vendedor: s.vendedor?.nome }))
      },
      preco: {
        preco_atual: produto.preco,
        preco_medio_mercado: precoMedioMercado,
        preco_ideal_sugerido: Math.round(precoIdeal),
        posicionamento: posicionamento,
        recomendacao: recomendacaoPreco
      },
      financeiro: {
        custo_estimado_producao: produto.preco * 0.4,
        custo_transporte: produto.preco * 0.1,
        custo_armazenamento: produto.preco * 0.05,
        margem_sugerida: margemSugerida,
        lucro_estimado_unitario: lucroUnitario
      },
      colheita: {
        autonomia_estoque_dias: autonomiaEstoque,
        estoque_atual: `${produto.quantidade} ${produto.unidade || 'un'}`,
        acao_recomendada: acaoRecomendada,
        periodo_plantio_sugerido: autonomiaEstoque < 30 ? 'Iniciar plantio imediatamente' : 'Planejar para proxima safra'
      },
      conservacao: obterEstrategiaConservacao(produto.nome),
      resumo: {
        saude_geral: saudeGeral,
        recomendacao_principal: recomendacaoPrincipal,
        acoes_imediatas: acoes.slice(0, 3)
      }
    };
  };

  const analisarProduto = async (produtoId) => {
    setLoading(true);
    try {
      const produto = produtos.find(p => p._id === produtoId);
      setProdutoSelecionado(produto);
      const analiseMercado = await realizarAnaliseInteligente(produto);
      setAnalise(analiseMercado);
      setRelatorio({ analises: analiseMercado, resumo_executivo: analiseMercado.resumo });
      const saudacao = `Analise do produto ${produto.nome} concluida. ${analiseMercado.resumo.recomendacao_principal}`;
      falar(saudacao);
    } catch (error) {
      console.error('Erro na analise:', error);
      alert('Erro ao analisar produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== GERAR PDF PROFISSIONAL ====================
  
  const gerarRelatorioPDF = async () => {
    if (!analise || !produtoSelecionado) {
      alert('Nenhuma analise disponivel para exportar');
      return;
    }

    try {
      const doc = new jsPDF();
      const dataAgora = new Date();
      const numeroRelatorio = `JIAM${dataAgora.getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      const nomeProdutoLimpo = limparTexto(produtoSelecionado?.nome || 'Produto');
      const categoriaLimpa = limparTexto(analise.produto?.categoria || 'N/A');
      const provinciaLimpa = limparTexto(produtoSelecionado?.provincia || 'N/A');
      const recomendacaoLimpa = limparTexto(analise.resumo?.recomendacao_principal || 'Analise concluida');
      const saudacaoLimpa = limparTexto(analise.resumo?.saude_geral || 'Em analise');

      // CABECALHO
      doc.setFontSize(20);
      doc.setTextColor(34, 197, 94);
      doc.text("JIAM Preditivo - Relatorio de Analise", 105, 20, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("Mercado Yangue - Inteligencia para o Agronegocio Angolano", 105, 28, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Relatorio N: ${numeroRelatorio}`, 14, 42);
      doc.text(`Data: ${dataAgora.toLocaleDateString()}`, 14, 48);
      doc.text(`Emitido por: ${limparTexto(usuario?.nome || 'Sistema JIAM')}`, 14, 54);

      // INFORMACOES DO PRODUTO
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("Informacoes do Produto", 14, 70);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Produto: ${nomeProdutoLimpo}`, 14, 80);
      doc.text(`Categoria: ${categoriaLimpa}`, 14, 87);
      doc.text(`Provincia: ${provinciaLimpa}`, 14, 94);
      doc.text(`Preco Atual: Kz ${(analise.preco?.preco_atual || 0).toLocaleString()}`, 14, 101);
      doc.text(`Quantidade: ${produtoSelecionado?.quantidade || 0} ${limparTexto(produtoSelecionado?.unidade || 'un')}`, 14, 108);

      // RESUMO EXECUTIVO
      let yPos = 122;
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("Resumo Executivo", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const linhasResumo = doc.splitTextToSize(recomendacaoLimpa, 180);
      doc.text(linhasResumo, 14, yPos);
      yPos += (linhasResumo.length * 6) + 6;
      doc.text(`Saude do Produto: ${saudacaoLimpa}`, 14, yPos);
      yPos += 10;
      
      doc.setTextColor(34, 197, 94);
      doc.text("Acoes Imediatas:", 14, yPos);
      yPos += 6;
      doc.setTextColor(0, 0, 0);
      const acoes = analise.resumo?.acoes_imediatas || ['Monitorar desempenho'];
      acoes.forEach((acao, idx) => {
        doc.text(`- ${limparTexto(acao)}`, 18, yPos + (idx * 6));
      });
      yPos += (acoes.length * 6) + 10;

      // INDICADORES
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("Indicadores de Desempenho", 14, yPos);
      yPos += 10;
      
      const indicadores = [
        { label: "Demanda Mensal", value: `${analise.mercado?.demanda_estimada_mensal || 0} un` },
        { label: "Tendencia", value: analise.mercado?.tendencia || 'Estavel' },
        { label: "Preco Ideal", value: `Kz ${(analise.preco?.preco_ideal_sugerido || 0).toLocaleString()}` },
        { label: "Margem", value: `${analise.financeiro?.margem_sugerida || 0}%` },
        { label: "Concorrentes", value: `${analise.mercado?.produtos_similares || 0}` },
        { label: "Autonomia", value: `${analise.colheita?.autonomia_estoque_dias || 0} dias` }
      ];
      
      let col = 0;
      indicadores.forEach((ind, idx) => {
        const xPos = 14 + (col * 95);
        doc.setFillColor(240, 250, 240);
        doc.rect(xPos, yPos - 5, 85, 22, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(ind.label, xPos + 5, yPos);
        doc.setFontSize(10);
        doc.setTextColor(34, 197, 94);
        doc.text(ind.value, xPos + 5, yPos + 10);
        col++;
        if (col >= 2) { col = 0; yPos += 26; }
      });
      yPos += 30;

      // ANALISE DE PRECO
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("Analise de Preco", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Preco Atual: Kz ${(analise.preco?.preco_atual || 0).toLocaleString()}`, 14, yPos);
      yPos += 6;
      doc.text(`Preco Medio: Kz ${(analise.preco?.preco_medio_mercado || 0).toLocaleString()}`, 14, yPos);
      yPos += 6;
      doc.text(`Preco Ideal: Kz ${(analise.preco?.preco_ideal_sugerido || 0).toLocaleString()}`, 14, yPos);
      yPos += 6;
      doc.text(`Posicionamento: ${limparTexto(analise.preco?.posicionamento || 'Neutro')}`, 14, yPos);
      yPos += 8;
      doc.setTextColor(200, 150, 0);
      doc.text(`Recomendacao: ${limparTexto(analise.preco?.recomendacao || 'Manter estrategia')}`, 14, yPos);
      yPos += 20;

      // PLANEJAMENTO DE COLHEITA
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text("Planejamento de Colheita", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Estoque: ${limparTexto(analise.colheita?.estoque_atual || 'N/A')}`, 14, yPos);
      yPos += 6;
      doc.text(`Autonomia: ${analise.colheita?.autonomia_estoque_dias || 0} dias`, 14, yPos);
      yPos += 6;
      doc.setTextColor(200, 150, 0);
      doc.text(`Acao: ${limparTexto(analise.colheita?.acao_recomendada || 'Monitorar')}`, 14, yPos);
      yPos += 20;

      // QR CODE
      try {
        const qrText = `https://mercadoyangue.co.ao/jiam/relatorio/${numeroRelatorio}`;
        const qrDataURL = await QRCode.toDataURL(qrText);
        doc.addImage(qrDataURL, 'PNG', 160, yPos - 15, 35, 35);
      } catch (qrError) {
        console.warn('Erro QR Code:', qrError);
      }

      // RODAPE
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Relatorio gerado pelo sistema JIAM Preditivo do Mercado Yangue.", 105, 278, { align: 'center' });
      doc.text(`Copyright ${new Date().getFullYear()} Mercado Yangue - Todos os direitos reservados.`, 105, 284, { align: 'center' });

      doc.save(`relatorio_jiam_${nomeProdutoLimpo.replace(/\s/g, '_')}_${numeroRelatorio}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar relatorio PDF. Tente novamente.');
    }
  };

  // ==================== CHATBOT IA COM VOZ ====================
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-PT';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onstart = () => setOuvindo(true);
      recognitionRef.current.onend = () => { setOuvindo(false); setReconhecimentoAtivo(false); };
      recognitionRef.current.onresult = (event) => {
        const texto = event.results[0][0].transcript;
        setInputChat(texto);
        enviarMensagemIA(texto);
      };
      recognitionRef.current.onerror = () => { setOuvindo(false); setReconhecimentoAtivo(false); };
    }
    if ('speechSynthesis' in window) synthesisRef.current = window.speechSynthesis;
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthesisRef.current) synthesisRef.current.cancel();
    };
  }, []);

  const falar = (texto) => {
    if (!vozAtiva || !synthesisRef.current) return;
    const textoLimpo = limparTextoExibicao(texto);
    if (!textoLimpo) return;
    try {
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(textoLimpo);
      utterance.lang = 'pt-PT';
      utterance.rate = 0.9;
      synthesisRef.current.speak(utterance);
    } catch (error) { console.error('Erro voz:', error); }
  };

  const iniciarReconhecimento = () => {
    if (!recognitionRef.current) { alert('Reconhecimento de voz nao suportado'); return; }
    if (reconhecimentoAtivo) { recognitionRef.current.stop(); return; }
    try { recognitionRef.current.start(); setReconhecimentoAtivo(true); }
    catch (error) { console.error('Erro microfone:', error); }
  };

  const enviarMensagemIA = async (mensagem) => {
    if (!mensagem.trim()) return;
    setMensagensChat(prev => [...prev, { remetente: 'user', texto: mensagem.trim() }]);
    setInputChat('');
    try {
      const response = await axios.post(`${API_URL}/chatbot`, {
        mensagem: mensagem.trim(),
        sessionId: usuario?.id || 'guest'
      });
      const respostaIA = response.data.resposta || 'Desculpe, nao consegui processar.';
      const respostaLimpa = limparTextoExibicao(respostaIA);
      setMensagensChat(prev => [...prev, { remetente: 'ia', texto: respostaLimpa }]);
      falar(respostaLimpa);
    } catch (error) {
      console.error('Erro chatbot:', error);
      const erroMsg = 'Erro ao conectar com o assistente. Tente novamente.';
      setMensagensChat(prev => [...prev, { remetente: 'ia', texto: erroMsg }]);
      falar(erroMsg);
    }
  };

  // ==================== CARREGAR PRODUTOS ====================
  
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const response = await axios.get(`${API_URL}/produtos`);
        setProdutos(response.data || []);
      } catch (error) { console.error('Erro ao carregar produtos:', error); }
    };
    carregarProdutos();
  }, []);

  const handleSelecionarProduto = (produtoId) => {
    const produto = produtos.find(p => p._id === produtoId);
    setProdutoSelecionado(produto);
    analisarProduto(produtoId);
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [mensagensChat]);

  // ==================== RENDER ====================
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabecalho */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">JIAM Preditivo - Agronegocio</h1>
            <p className="text-green-100 text-sm mt-1">Inteligencia de dados para decisoes estrategicas</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setVozAtiva(!vozAtiva)} className={`px-3 py-1.5 rounded-lg text-sm transition ${vozAtiva ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
              {vozAtiva ? 'Desativar Voz' : 'Ativar Voz'}
            </button>
            <button onClick={() => setChatAberto(!chatAberto)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm transition">
              Assistente IA
            </button>
          </div>
        </div>
      </div>

      {/* Chatbot IA Flutuante */}
      {chatAberto && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border z-50 flex flex-col overflow-hidden">
          <div className="bg-green-700 p-3 text-white">
            <div className="flex justify-between items-center">
              <div><h3 className="font-bold text-sm">Assistente JIAM</h3><p className="text-xs opacity-90">Sempre online</p></div>
              <div className="flex gap-2">
                <button onClick={iniciarReconhecimento} className={`px-2 py-1 rounded text-xs transition ${reconhecimentoAtivo ? 'bg-red-500 animate-pulse' : 'bg-white/20 hover:bg-white/30'}`}>
                  {reconhecimentoAtivo ? 'Parar' : (ouvindo ? 'Ouvindo...' : 'Falar')}
                </button>
                <button onClick={() => setChatAberto(false)} className="text-white/80 hover:text-white text-sm">Fechar</button>
              </div>
            </div>
          </div>
          <div ref={chatRef} className="h-96 overflow-y-auto p-3 space-y-2 bg-gray-50 text-sm">
            {mensagensChat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.remetente === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2 rounded-lg ${msg.remetente === 'user' ? 'bg-green-600 text-white' : 'bg-white border text-gray-800'}`}>
                  <div className="text-xs opacity-70 mb-1">{msg.remetente === 'user' ? 'Voce' : 'Assistente'}</div>
                  <p className="text-sm whitespace-pre-wrap">{msg.texto}</p>
                </div>
              </div>
            ))}
            {reconhecimentoAtivo && <div className="flex justify-start"><div className="bg-gray-200 text-gray-600 p-2 rounded-lg text-sm">Ouvindo...</div></div>}
          </div>
          <div className="p-2 border-t bg-white flex gap-2">
            <input type="text" value={inputChat} onChange={(e) => setInputChat(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensagemIA(inputChat)} placeholder="Digite sua pergunta..." className="flex-1 border rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none" />
            <button onClick={iniciarReconhecimento} className={`px-3 py-1.5 rounded-lg text-sm transition ${reconhecimentoAtivo ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{reconhecimentoAtivo ? 'Parar' : 'Falar'}</button>
            <button onClick={() => enviarMensagemIA(inputChat)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">Enviar</button>
          </div>
        </div>
      )}

      {/* Selecao de Produto */}
      <div className="bg-white rounded-xl shadow-lg p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Selecione um Produto</h2>
        <select onChange={(e) => handleSelecionarProduto(e.target.value)} className="w-full border rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500" defaultValue="">
          <option value="" disabled>Escolha um produto</option>
          {produtos.map(p => (<option key={p._id} value={p._id}>{p.nome} - {p.provincia}</option>))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 bg-white rounded-xl shadow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-3 text-gray-600 text-sm">Analisando mercado...</p>
        </div>
      )}

      {/* Resultados */}
      {analise && !loading && produtoSelecionado && (
        <>
          {/* Cards Rapidos */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl p-3 text-center shadow"><div className="text-sm text-gray-500">Preco Ideal</div><div className="font-bold text-green-700">Kz {(analise.preco?.preco_ideal_sugerido || 0).toLocaleString()}</div></div>
            <div className="bg-white rounded-xl p-3 text-center shadow"><div className="text-sm text-gray-500">Demanda Mensal</div><div className="font-bold text-blue-700">{analise.mercado?.demanda_estimada_mensal || 0} un</div></div>
            <div className="bg-white rounded-xl p-3 text-center shadow"><div className="text-sm text-gray-500">Margem</div><div className="font-bold text-purple-700">{analise.financeiro?.margem_sugerida || 0}%</div></div>
            <div className="bg-white rounded-xl p-3 text-center shadow"><div className="text-sm text-gray-500">Concorrentes</div><div className="font-bold text-orange-700">{analise.mercado?.produtos_similares || 0}</div></div>
            <div className="bg-white rounded-xl p-3 text-center shadow"><div className="text-sm text-gray-500">Saude</div><div className="font-bold">{analise.resumo?.saude_geral || 'N/A'}</div></div>
          </div>

          {/* Resumo Executivo */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-5 bg-green-50">
              <h2 className="text-xl font-bold mb-3">Resumo Executivo</h2>
              <p className="mb-2"><strong>Produto:</strong> {produtoSelecionado.nome}</p>
              <p className="mb-2"><strong>Recomendacao:</strong> <span className="font-semibold text-green-700">{analise.resumo?.recomendacao_principal}</span></p>
              <div className="mt-3 p-3 bg-white rounded-lg">
                <strong>Acoes Imediatas</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                  {analise.resumo?.acoes_imediatas?.map((acao, idx) => (<li key={idx} className="text-gray-700">{acao}</li>))}
                </ul>
              </div>
            </div>
          </div>

          {/* Abas de Navegacao */}
          <div className="flex flex-wrap gap-2 border-b pb-2 overflow-x-auto">
            {abas.map(aba => (<button key={aba.id} onClick={() => setAbaAtiva(aba.id)} className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${abaAtiva === aba.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{aba.nome}</button>))}
          </div>

          {/* Conteudo das Abas - Versao Simplificada */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            {abaAtiva === 'resumo' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4"><h4 className="font-bold text-green-700 mb-2">Indicadores Chave</h4><p><strong>Demanda:</strong> {analise.mercado?.demanda_estimada_mensal || 0} un</p><p><strong>Tendencia:</strong> {analise.mercado?.tendencia || 'Estavel'}</p><p><strong>Posicionamento:</strong> {analise.preco?.posicionamento || 'Neutro'}</p></div>
                <div className="border rounded-lg p-4"><h4 className="font-bold text-green-700 mb-2">Projecoes</h4><p><strong>Receita potencial:</strong> Kz {(analise.mercado?.demanda_estimada_mensal * analise.preco?.preco_ideal_sugerido).toLocaleString()}</p><p><strong>Margem:</strong> {analise.financeiro?.margem_sugerida}%</p></div>
              </div>
            )}
            {abaAtiva === 'mercado' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Demanda e Tendencia</h4><p><strong>Demanda mensal:</strong> {analise.mercado?.demanda_estimada_mensal || 0} un</p><p><strong>Tendencia:</strong> {analise.mercado?.tendencia || 'Estavel'}</p><p><strong>Concorrentes:</strong> {analise.mercado?.produtos_similares || 0}</p></div>
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Concorrencia</h4>{analise.mercado?.concorrentes?.length > 0 ? (analise.mercado.concorrentes.slice(0, 3).map((c, idx) => (<div key={idx} className="mb-2"><p><strong>{c.nome}</strong> - Kz {(c.preco || 0).toLocaleString()}</p></div>))) : (<p className="text-gray-500">Nenhum concorrente direto</p>)}</div>
              </div>
            )}
            {abaAtiva === 'preco' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Analise de Preco</h4><p><strong>Atual:</strong> Kz {analise.preco?.preco_atual?.toLocaleString()}</p><p><strong>Medio mercado:</strong> Kz {analise.preco?.preco_medio_mercado?.toLocaleString()}</p><p><strong>Ideal sugerido:</strong> <span className="text-green-700 font-bold">Kz {analise.preco?.preco_ideal_sugerido?.toLocaleString()}</span></p><p className="mt-2 text-yellow-700">{analise.preco?.recomendacao}</p></div>
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Impacto</h4>{analise.preco?.preco_atual > analise.preco?.preco_ideal_sugerido ? (<p>Reduzir preco pode aumentar vendas em ate 30%</p>) : (<p>Preco otimizado, mantenha estrategia</p>)}</div>
              </div>
            )}
            {abaAtiva === 'financeiro' && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Receita</h4><p>Potencial mensal: Kz {(analise.mercado?.demanda_estimada_mensal * analise.preco?.preco_ideal_sugerido).toLocaleString()}</p></div>
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Lucratividade</h4><p>Margem: {analise.financeiro?.margem_sugerida}%</p><p>Lucro unitario: Kz {analise.financeiro?.lucro_estimado_unitario?.toLocaleString()}</p></div>
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">ROI</h4><p>Retorno estimado: {analise.financeiro?.margem_sugerida * 1.5}%</p></div>
              </div>
            )}
            {abaAtiva === 'colheita' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Estoque</h4><p><strong>Atual:</strong> {analise.colheita?.estoque_atual}</p><p><strong>Autonomia:</strong> {analise.colheita?.autonomia_estoque_dias} dias</p><p className="text-yellow-700">{analise.colheita?.acao_recomendada}</p></div>
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Planejamento</h4><p><strong>Plantio:</strong> {analise.colheita?.periodo_plantio_sugerido}</p></div>
              </div>
            )}
            {abaAtiva === 'conservacao' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Condicoes Ideais</h4><p><strong>Temperatura:</strong> {analise.conservacao?.temperatura}</p><p><strong>Umidade:</strong> {analise.conservacao?.umidade}</p><p><strong>Metodo:</strong> {analise.conservacao?.metodo}</p></div>
                <div className="border rounded-lg p-4 bg-green-50"><h4 className="font-bold text-green-800 mb-2">Dicas</h4><ul className="list-disc list-inside text-sm">{analise.conservacao?.dicas?.map((dica, idx) => (<li key={idx}>{dica}</li>))}</ul></div>
              </div>
            )}
            {abaAtiva === 'concorrentes' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Posicionamento</h4><p><strong>Sua posicao:</strong> {analise.preco?.posicionamento || 'Neutro'}</p><p><strong>Preco vs mercado:</strong> {analise.preco?.preco_atual > analise.preco?.preco_medio_mercado ? 'Acima da media' : 'Abaixo ou igual'}</p><p className="text-yellow-700">{analise.preco?.recomendacao}</p></div>
                <div className="border rounded-lg p-4 bg-green-50"><h4 className="font-bold text-green-800 mb-2">Estrategia</h4><ul className="list-disc list-inside text-sm"><li>{analise.preco?.preco_atual > analise.preco?.preco_medio_mercado ? 'Considere reducao de preco' : 'Preco competitivo, foque em qualidade'}</li><li>Invista em marketing digital</li><li>Ofereca diferencial na entrega</li></ul></div>
              </div>
            )}
            {abaAtiva === 'custos' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4"><h4 className="font-bold mb-2">Estrutura de Custos</h4><p><strong>Producao:</strong> Kz {analise.financeiro?.custo_estimado_producao?.toLocaleString()}</p><p><strong>Transporte:</strong> Kz {analise.financeiro?.custo_transporte?.toLocaleString()}</p><p><strong>Armazenamento:</strong> Kz {analise.financeiro?.custo_armazenamento?.toLocaleString()}</p></div>
                <div className="border rounded-lg p-4 bg-red-50"><h4 className="font-bold text-red-800 mb-2">Oportunidades</h4><ul className="list-disc list-inside text-sm"><li>Otimize rotas de transporte</li><li>Invista em embalagens adequadas</li><li>Negocie insumos em volume</li></ul></div>
              </div>
            )}
          </div>

          {/* Botao Exportar PDF */}
          <div className="flex justify-end">
            <button onClick={gerarRelatorioPDF} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-2"><FileText size={16} /> Exportar Relatorio PDF</button>
          </div>
        </>
      )}

      {!analise && !loading && produtos.length > 0 && (
        <div className="text-center py-8 bg-white rounded-xl shadow"><p className="text-gray-500">Selecione um produto para iniciar a analise</p></div>
      )}
    </div>
  );
}

export default AbaPrevisoesAgro;