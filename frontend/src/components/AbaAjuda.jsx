import { useState, useRef, useEffect } from "react";
import { HelpCircle, MessageCircle, ChevronDown, ChevronUp, Info, Send, X, Bot, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AbaAjuda({ usuario }) {
  const [perguntaAtiva, setPerguntaAtiva] = useState(null);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagens, setMensagens] = useState([
    { remetente: "bot", texto: "Olá! Sou a Yangue IA — assistente virtual do Mercado Yangue. Posso ajudar com dúvidas sobre compras, vendas, entregas, o sistema JIAM Preditivo e muito mais. Como posso ajudar você hoje?" },
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
      resposta: "Clique em 'Iniciar Sessão/Cadastrar' no topo da página, escolha 'Cadastro' e preencha os seus dados. Receberá um e-mail de confirmação e pronto, estará dentro do Mercado Yangue!",
    },
    {
      titulo: "Como posso vender um produto?",
      resposta: "Cadastre-se como Vendedor/Agricultor, aceite o Contrato Digital (comissão de 0.5% por venda), acesse a aba 'Cadastrar Produto', adicione fotos, descrição, preço e quantidade. Publique e seu produto será exibido para milhares de compradores em todo o país.",
    },
    {
      titulo: "Como comprar com segurança?",
      resposta: "Analise as informações do produto, fale com o vendedor pelo chat interno. Evite pagamentos fora da plataforma e guarde os comprovativos. A segurança é a base da confiança Yangue.",
    },
    {
      titulo: "Como funciona o JIAM Preditivo?",
      resposta: "O JIAM Preditivo é nosso sistema de inteligência de dados que analisa mercado, preços, tendências e ajuda na tomada de decisão agrícola. Acesse a aba 'JIAM Previsões' para análises detalhadas dos seus produtos!",
    },
    {
      titulo: "Como acompanhar as minhas encomendas?",
      resposta: "Acesse a aba 'Rastrear' para acompanhar suas entregas em tempo real. Você verá a localização do entregador, rota e tempo estimado.",
    },
    {
      titulo: "Quero ser entregador, como faço?",
      resposta: "Cadastre-se como Entregador, informe veículo, placa e telefone, ative sua localização, receba solicitações de entrega, aceite e realize as entregas. Entregadores ativos com boas avaliações recebem mais solicitações!",
    },
  ];

  // Inicializar reconhecimento de voz
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
      const respostaTexto = resposta.data.resposta || "Desculpe, não consegui processar sua solicitação.";
      setMensagens((msgs) => [...msgs, { remetente: "bot", texto: respostaTexto }]);
      if (vozAtiva) falar(respostaTexto);
    } catch (err) {
      console.error("Erro ao obter resposta da IA:", err);
      const erroMsg = "Erro ao conectar com o assistente. Tente novamente mais tarde.";
      setMensagens((msgs) => [...msgs, { remetente: "bot", texto: erroMsg }]);
      if (vozAtiva) falar(erroMsg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-6 relative">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-9 w-9 text-green-700" />
        <h2 className="text-3xl font-bold text-green-800">Ajuda Interactiva</h2>
      </div>

      <p className="text-green-900 mb-6 text-sm md:text-base leading-relaxed">
        Tens dúvidas? Estás no sítio certo. Aqui encontras respostas rápidas, práticas e adaptadas à tua experiência no <strong>Mercado Yangue</strong>.
        E agora com a <strong>IA Yangue</strong> — uma assistente inteligente pronta a ajudar-te em tempo real!
      </p>

      {/* FAQ Accordion */}
      <div className="space-y-4">
        {perguntas.map((p, index) => (
          <div key={index} className="border border-green-200 rounded-xl overflow-hidden shadow-sm">
            <button
              className="w-full flex justify-between items-center p-4 bg-green-50 hover:bg-green-100 transition"
              onClick={() => togglePergunta(index)}
            >
              <span className="font-semibold text-green-800">{p.titulo}</span>
              {perguntaAtiva === index ? <ChevronUp className="h-5 w-5 text-green-700" /> : <ChevronDown className="h-5 w-5 text-green-700" />}
            </button>
            {perguntaAtiva === index && (
              <div className="p-4 bg-white text-sm text-green-700 border-t border-green-100">
                {p.resposta}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Seção de contacto */}
      <div className="mt-10 bg-green-100 border border-green-300 rounded-xl p-5 flex items-start gap-3">
        <Info className="h-6 w-6 text-green-700 mt-1" />
        <p className="text-green-800 text-sm">
          Ainda com dúvidas? Contacta-nos via WhatsApp <strong>+244 928 565 837</strong> ou e-mail <strong>mercadoyangueservicosdigitais@gmail.com</strong>.
          Estamos aqui para te ajudar — sempre.
        </p>
      </div>

      {/* Botão flutuante do Chatbot IA */}
      <button
        onClick={() => setChatAberto(!chatAberto)}
        className="fixed bottom-32 right-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full p-4 shadow-2xl flex items-center justify-center transition z-50"
      >
        {chatAberto ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* Janela do Chatbot IA */}
      {chatAberto && (
        <div className="fixed bottom-44 right-6 bg-white w-80 md:w-96 rounded-2xl shadow-2xl border border-green-400 flex flex-col overflow-hidden z-50">
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 py-3 font-semibold flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span>Yangue IA — Assistente Virtual</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setVozAtiva(!vozAtiva)} className="p-1 rounded hover:bg-white/20" title={vozAtiva ? 'Desativar voz' : 'Ativar voz'}>
                {vozAtiva ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button onClick={iniciarReconhecimento} className="p-1 rounded hover:bg-white/20" title="Falar com IA">
                {reconhecimentoAtivo ? <MicOff size={16} className="text-red-300" /> : <Mic size={16} />}
              </button>
              <button onClick={() => setChatAberto(false)} className="p-1 rounded hover:bg-white/20">
                <X size={16} />
              </button>
            </div>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-green-50 h-80">
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.remetente === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-2 rounded-lg max-w-[85%] ${
                    m.remetente === "user"
                      ? "bg-green-700 text-white"
                      : "bg-white text-green-800 border border-green-200"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">{m.remetente === "user" ? "Você" : "Yangue IA"}</div>
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

          <div className="flex p-2 border-t border-green-200 bg-white gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleEnviar()}
              placeholder="Escreva sua pergunta..."
              className="flex-1 border border-green-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            <button
              onClick={iniciarReconhecimento}
              className={`p-2 rounded-lg transition ${reconhecimentoAtivo ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              title="Falar"
            >
              {reconhecimentoAtivo ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              onClick={() => handleEnviar()}
              className="bg-green-700 hover:bg-green-800 text-white rounded-lg p-2 flex items-center justify-center transition"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}