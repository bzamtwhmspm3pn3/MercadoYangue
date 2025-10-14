import { useState, useRef, useEffect } from "react";
import { HelpCircle, MessageCircle, ChevronDown, ChevronUp, Info, Send, X } from "lucide-react";
import axios from "axios";

export default function AbaAjuda() {
  const [perguntaAtiva, setPerguntaAtiva] = useState(null);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagens, setMensagens] = useState([
    { remetente: "bot", texto: "👋 Olá! Sou a Yangue IA — posso ajudar-te com dúvidas sobre o MercadoYangue." },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  const perguntas = [
    {
      titulo: "Como criar a minha conta?",
      resposta: `
        Clica em “Iniciar Sessão/Cadastrar” no topo da página, escolhe “Cadastro” 
        e preenche os teus dados. Receberás um e-mail de confirmação e pronto, 
        estás dentro do MercadoYangue! 🚀
      `,
    },
    {
      titulo: "Como posso vender um produto?",
      resposta: `
        Vai ao teu painel e selecciona “Cadastrar Produto”. 
        Adiciona nome do produto, quantidade, unidade de medida ( por exemplo: kg, saco),  fotos, preço e descrição. 
        Publica e o teu produto será exibido para milhares de compradores em todo o país. 🇦🇴
      `,
    },
    {
      titulo: "Como comprar com segurança?",
      resposta: `
        Analisa bem as informações do produto e fala sempre com o vendedor 
        pelo Batepapo/Chat interno ou WhatsApp verificado. Evita pagamentos fora da plataforma 
        e guarda os comprovativos. A segurança é a base da confiança Yangue. 🔒
      `,
    },
    {
      titulo: "Como acompanhar as minhas encomendas?",
      resposta: `
        “Ligue para o Contacto do Motorista associado a tua compra” e acompanha o estado da tua encomenda em tempo real. 
        Se o vendedor usa envio rápido, poderás entrar em contacto directamente com ele. 📦
      `,
    },
  ];

  const togglePergunta = (index) => {
    setPerguntaAtiva(perguntaAtiva === index ? null : index);
  };

  // 🔹 Rolagem automática do chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensagens]);

  // 🔹 Envio da mensagem para backend
 const handleEnviar = async () => {
  if (!input.trim()) return;

  const pergunta = input.trim();
  setMensagens((msgs) => [...msgs, { remetente: "user", texto: pergunta }]);
  setInput("");

  try {
    // Chama o backend correto (porta 5000, rota /api/chatbot)
    const resposta = await axios.post("https://mercadoyangue-i3in.onrender.com/api/chatbot", {
      mensagem: pergunta,
    });

    setMensagens((msgs) => [
      ...msgs,
      {
        remetente: "bot",
        texto: resposta.data.resposta || "Sem resposta definida 😅",
      },
    ]);
  } catch (err) {
    console.error("Erro ao obter resposta da IA:", err);
    setMensagens((msgs) => [
      ...msgs,
      {
        remetente: "bot",
        texto: "❌ Erro ao conectar com o servidor da IA local.",
      },
    ]);
  }
};

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-6 relative">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-9 w-9 text-green-700" />
        <h2 className="text-3xl font-bold text-green-800">Ajuda Interactiva</h2>
      </div>

      <p className="text-green-900 mb-6 text-sm md:text-base leading-relaxed">
        Tens dúvidas? Estás no sítio certo. Aqui encontras respostas rápidas, 
        práticas e adaptadas à tua experiência no <strong>MercadoYangue</strong>.  
        E agora com a <strong>IA Yangue</strong> 💬 — uma assistente inteligente pronta a ajudar-te em tempo real!
      </p>

      <div className="space-y-4">
        {perguntas.map((p, index) => (
          <div key={index} className="border border-green-200 rounded-xl overflow-hidden shadow-sm">
            <button
              className="w-full flex justify-between items-center p-4 bg-green-50 hover:bg-green-100 transition"
              onClick={() => togglePergunta(index)}
            >
              <span className="font-semibold text-green-800">{p.titulo}</span>
              {perguntaAtiva === index ? (
                <ChevronUp className="h-5 w-5 text-green-700" />
              ) : (
                <ChevronDown className="h-5 w-5 text-green-700" />
              )}
            </button>
            {perguntaAtiva === index && (
              <div className="p-4 bg-white text-sm text-green-700 border-t border-green-100 animate-fadeIn">
                {p.resposta}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ℹ️ Secção de contacto */}
      <div className="mt-10 bg-green-100 border border-green-300 rounded-xl p-5 flex items-start gap-3">
        <Info className="h-6 w-6 text-green-700 mt-1" />
        <p className="text-green-800 text-sm">
          Ainda com dúvidas? Contacta-nos via WhatsApp{" "}
          <strong>+244 920 000 000</strong> ou e-mail{" "}
          <strong>suporte@mercadoyangue.co.ao</strong>.  
          Estamos aqui para te ajudar — sempre. 💬
        </p>
      </div>

      {/* 💬 Botão flutuante do Chatbot */}
      <button
        onClick={() => setChatAberto(!chatAberto)}
        className="fixed bottom-6 right-6 bg-green-700 hover:bg-green-800 text-white rounded-full p-4 shadow-2xl flex items-center justify-center transition"
      >
        {chatAberto ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* 🧠 Janela do Chatbot */}
      {chatAberto && (
        <div className="fixed bottom-20 right-6 bg-white w-80 md:w-96 rounded-2xl shadow-2xl border border-green-400 flex flex-col overflow-hidden">
          <div className="bg-green-700 text-white px-4 py-3 font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Yangue IA — Assistente Virtual 🌿
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-green-50">
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[80%] ${
                  m.remetente === "user"
                    ? "bg-green-700 text-white self-end ml-auto"
                    : "bg-white text-green-800 border border-green-200"
                }`}
              >
                {m.texto}
              </div>
            ))}
          </div>

          <div className="flex p-2 border-t border-green-200 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreve aqui..."
              className="flex-1 border border-green-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            <button
              onClick={handleEnviar}
              className="ml-2 bg-green-700 hover:bg-green-800 text-white rounded-lg p-2 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

