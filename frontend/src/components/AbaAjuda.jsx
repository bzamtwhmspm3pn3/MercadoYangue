import { useState, useRef, useEffect } from "react";
import { HelpCircle, MessageCircle, ChevronDown, ChevronUp, Info, Send, X, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AbaAjuda({ usuario }) {
  const [perguntaAtiva, setPerguntaAtiva] = useState(null);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagens, setMensagens] = useState([
    { remetente: "bot", texto: "Ola! Sou o assistente virtual da AgriMarket. Posso ajudar com duvidas sobre compras, vendas, entregas, JIAM Preditivo e muito mais. Como posso ajudar hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [reconhecimentoAtivo, setReconhecimentoAtivo] = useState(false);
  const [vozAtiva, setVozAtiva] = useState(true);
  const [ouvindo, setOuvindo] = useState(false);
  const recognitionRef = useRef(null);
  const chatRef = useRef(null);
  const synthesisRef = useRef(null);

  const perguntas = [
    {
      titulo: "Como criar a minha conta?",
      resposta: "Clique em 'Entrar' no topo da pagina, escolha 'Criar Conta' e preencha os seus dados. Recebera um e-mail de confirmacao e pronto, estara dentro da AgriMarket!",
    },
    {
      titulo: "Como posso vender um produto?",
      resposta: "Cadastre-se como Vendedor/Agricultor, aceite o Contrato Digital (comissao de 0.5% por venda), acesse a aba 'Cadastrar Produto', adicione fotos, descricao, preco e quantidade. Publique e seu produto sera exibido para compradores em todo o pais.",
    },
    {
      titulo: "Como comprar com seguranca?",
      resposta: "Analise as informacoes do produto, fale com o vendedor pelo chat interno. Evite pagamentos fora da plataforma e guarde os comprovativos. A seguranca e a base da confianca.",
    },
    {
      titulo: "Como funciona o JIAM Preditivo?",
      resposta: "O JIAM Preditivo e nosso sistema de inteligencia de dados que analisa mercado, precos, tendencias e ajuda na tomada de decisao agricola. Acesse a aba 'JIAM Agro' para analises detalhadas dos seus produtos!",
    },
    {
      titulo: "Como acompanhar as minhas encomendas?",
      resposta: "Acesse a aba 'Rastrear' para acompanhar suas entregas em tempo real. Voce vera a localizacao do entregador, rota e tempo estimado.",
    },
    {
      titulo: "Quero ser entregador, como faco?",
      resposta: "Cadastre-se como Entregador, informe veiculo, placa e telefone, ative sua localizacao, receba solicitacoes de entrega, aceite e realize as entregas.",
    },
  ];

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
        setInput(texto);
        handleEnviar(texto);
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
    try {
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'pt-PT';
      utterance.rate = 0.9;
      synthesisRef.current.speak(utterance);
    } catch (error) { console.error('Erro voz:', error); }
  };

  const iniciarReconhecimento = () => {
    if (!recognitionRef.current) { alert('Reconhecimento de voz nao suportado neste navegador'); return; }
    if (reconhecimentoAtivo) { recognitionRef.current.stop(); return; }
    try { recognitionRef.current.start(); setReconhecimentoAtivo(true); }
    catch (error) { console.error('Erro microfone:', error); }
  };

  const togglePergunta = (index) => {
    setPerguntaAtiva(perguntaAtiva === index ? null : index);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleEnviar = async (textoPersonalizado = null) => {
    const mensagem = textoPersonalizado || input;
    if (!mensagem.trim()) return;

    setMensagens((msgs) => [...msgs, { remetente: "user", texto: mensagem }]);
    setInput("");

    try {
      const resposta = await axios.post(`${API_URL}/chatbot`, {
        mensagem: mensagem,
        sessionId: usuario?.id || 'guest'
      });
      const respostaTexto = resposta.data.resposta || "Desculpe, nao consegui processar sua solicitacao.";
      setMensagens((msgs) => [...msgs, { remetente: "bot", texto: respostaTexto }]);
      if (vozAtiva) falar(respostaTexto);
    } catch (err) {
      console.error("Erro ao obter resposta:", err);
      const erroMsg = "Erro ao conectar com o assistente. Tente novamente mais tarde.";
      setMensagens((msgs) => [...msgs, { remetente: "bot", texto: erroMsg }]);
      if (vozAtiva) falar(erroMsg);
    }
  };

  return (
    <div className="container-page">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="section-title mb-2">Ajuda</h2>
          <p className="text-gray-600">
            Tem duvidas? Encontre respostas rapidas e praticas para a sua experiencia na AgriMarket.
          </p>
        </div>

        <div className="space-y-3">
          {perguntas.map((p, index) => (
            <div key={index} className="card overflow-hidden">
              <button
                className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => togglePergunta(index)}
              >
                <span className="font-medium text-gray-900 pr-4">{p.titulo}</span>
                {perguntaAtiva === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {perguntaAtiva === index && (
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                  {p.resposta}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 bg-agro-50 border border-agro-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-agro-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-agro-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Ainda com duvidas?</h3>
              <p className="text-sm text-gray-600">
                Contacte-nos via WhatsApp <strong>+244 928 565 837</strong> ou e-mail{' '}
                <strong>mercadoyangueservicosdigitais@gmail.com</strong>.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setChatAberto(!chatAberto)}
          className="fixed bottom-6 right-6 bg-agro-700 hover:bg-agro-800 text-white rounded-full p-4 shadow-2xl flex items-center justify-center transition z-50"
        >
          {chatAberto ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>

        {chatAberto && (
          <div className="fixed bottom-24 right-6 bg-white w-80 md:w-96 rounded-2xl shadow-2xl border border-agro-200 flex flex-col overflow-hidden z-50">
            <div className="bg-gradient-to-r from-agro-700 to-agro-600 text-white px-4 py-3 font-semibold flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Assistente AgriMarket</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setVozAtiva(!vozAtiva)} className="p-1 rounded hover:bg-white/20" title={vozAtiva ? 'Desativar voz' : 'Ativar voz'}>
                  {vozAtiva ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button onClick={iniciarReconhecimento} className="p-1 rounded hover:bg-white/20" title="Falar">
                  {reconhecimentoAtivo ? <MicOff size={16} className="text-red-300" /> : <Mic size={16} />}
                </button>
                <button onClick={() => setChatAberto(false)} className="p-1 rounded hover:bg-white/20">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-gray-50 h-80">
              {mensagens.map((m, i) => (
                <div key={i} className={`flex ${m.remetente === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-2 rounded-lg max-w-[85%] ${
                    m.remetente === "user"
                      ? "bg-agro-700 text-white"
                      : "bg-white text-gray-800 border border-agro-200"
                  }`}>
                    <div className="text-xs opacity-70 mb-1">{m.remetente === "user" ? "Voce" : "Assistente"}</div>
                    <p className="text-sm whitespace-pre-wrap">{m.texto}</p>
                  </div>
                </div>
              ))}
              {reconhecimentoAtivo && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-600 p-2 rounded-lg text-sm">Ouvindo...</div>
                </div>
              )}
            </div>

            <div className="flex p-2 border-t border-gray-200 bg-white gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleEnviar()}
                placeholder="Digite sua pergunta..."
                className="flex-1 border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-agro-500 focus:outline-none"
              />
              <button
                onClick={iniciarReconhecimento}
                className={`p-2 rounded-lg transition ${reconhecimentoAtivo ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Falar"
              >
                {reconhecimentoAtivo ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button
                onClick={() => handleEnviar()}
                className="bg-agro-700 hover:bg-agro-800 text-white rounded-lg p-2 flex items-center justify-center transition"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
