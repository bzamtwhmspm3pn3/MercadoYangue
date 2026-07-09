import { useEffect, useState, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connectSocket } from "../socket";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/* Configurações */
const emojisDisponiveis = ["😀", "😄", "❤️", "🙏", "👍", "💡", "🔥", "😢"];
const tiposAceitos = [
  "image/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export default function AbaChat({ usuario }) {
  // Estados
  const [mensagem, setMensagem] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [historico, setHistorico] = useState([]);
  const [conversasRecentes, setConversasRecentes] = useState([]);
  const [conversasSelecionadas, setConversasSelecionadas] = useState(new Set());
  const [atual, setAtual] = useState(null);
  const [digitandoDe, setDigitandoDe] = useState(null);
  const [arquivoBase64, setArquivoBase64] = useState(null);
  const [arquivoNome, setArquivoNome] = useState(null);
  const [arquivoTipo, setArquivoTipo] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [remetente, setRemetente] = useState(null);

  // Refs
  const inputFileRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const ultimaMsgIdRef = useRef(null);
  const socketRef = useRef(null);

  // -----------------------
// Helpers
// -----------------------
const gerarChaveChat = useCallback((nome1, nome2) => {
  if (!nome1 || !nome2) return null;
  return [String(nome1), String(nome2)].sort().join("_");
}, []);

const pegarHistorico = useCallback(
  (outro) => {
    if (!usuario?.nome || !outro) return [];
    const chave = gerarChaveChat(usuario.nome, outro);
    try {
      const dados = JSON.parse(localStorage.getItem(chave)) || [];
      if (!Array.isArray(dados)) return [];
      return dados.map((m) => ({
        ...m,
        texto: m.texto || m.conteudo || "",
        remetente: typeof m.remetente === "object" ? m.remetente.nome : m.remetente,
        destinatario: typeof m.destinatario === "object" ? m.destinatario.nome : m.destinatario,
      }));
    } catch {
      return [];
    }
  },
  [usuario?.nome, gerarChaveChat]
);

const salvarHistorico = useCallback(
  (outro, novoHistorico) => {
    if (!usuario?.nome || !outro) return;
    const chave = gerarChaveChat(usuario.nome, outro);
    try {
      localStorage.setItem(chave, JSON.stringify(novoHistorico));
    } catch (e) {
      console.warn("Erro ao salvar historico:", e);
    }
  },
  [usuario?.nome, gerarChaveChat]
);

const marcarComoLida = useCallback(
  (outro) => {
    if (!usuario?.nome || !outro) return;
    const chave = gerarChaveChat(usuario.nome, outro);
    try {
      const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
      if (!status[chave]) status[chave] = {};
      status[chave][usuario.nome] = 0;
      status[chave].vistoPor = status[chave].vistoPor || {};
      status[chave].vistoPor[usuario.nome] = true;
      localStorage.setItem("statusMensagens", JSON.stringify(status));

      setConversasRecentes((prev) =>
        prev.map((c) =>
          c.nome === outro ? { ...c, temNaoLidas: false, countNaoLidas: 0 } : c
        )
      );
    } catch {}
  },
  [usuario?.nome, gerarChaveChat]
);

const atualizarConversas = useCallback(() => {
  if (!usuario?.nome) {
    setConversasRecentes([]);
    return;
  }
  try {
    const chaves = Object.keys(localStorage);
    const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
    const conversas = [];

    chaves.forEach((chave) => {
      if (!chave.includes("_")) return;
      const [n1, n2] = chave.split("_");
      if (n1 !== usuario.nome && n2 !== usuario.nome) return;
      const outro = n1 === usuario.nome ? n2 : n1;
      const histor = pegarHistorico(outro);
      if (!Array.isArray(histor)) return;
      const ultimaMensagem = [...histor].reverse().find((m) => !!m.texto || !!m.imagem || !!m.arquivo) || {};

      conversas.push({
        nome: outro,
        ultimaMensagem:
          ultimaMensagem?.texto ||
          (ultimaMensagem?.imagem ? "📷 Imagem" : "") ||
          (ultimaMensagem?.arquivo ? `📎 ${ultimaMensagem.arquivoNome}` : ""),
        temNaoLidas: (status[chave]?.[usuario.nome] || 0) > 0,
        countNaoLidas: status[chave]?.[usuario.nome] || 0,
        data: ultimaMensagem?.data || "1970-01-01",
      });
    });

    conversas.sort((a, b) => new Date(b.data) - new Date(a.data));
    setConversasRecentes(conversas);
  } catch (e) {
    console.warn("Erro atualizarConversas:", e);
    setConversasRecentes([]);
  }
}, [usuario?.nome, pegarHistorico]);

// -----------------------
// Efeitos iniciais
// -----------------------
useEffect(() => {
  try {
    const vendedor = JSON.parse(localStorage.getItem("vendedorSelecionado"));
    if (vendedor) setRemetente(vendedor);
  } catch {}
}, []);

useEffect(() => {
  if (usuario && usuario.nome) setUsuarioActual(usuario.nome);
}, [usuario]);

// -----------------------
// Socket & Recebimento
// -----------------------
useEffect(() => {
  if (!usuario?.id) return;

  const socket = connectSocket(usuario.id);
  socketRef.current = socket;
  window.socket = socket;

  const handleReceive = (msg) => {
  try {
    const novoMsg = {
      ...msg,
      texto: msg.texto || msg.conteudo || "",
      remetente: typeof msg.remetente === "object" ? msg.remetente.nome : msg.remetente,
      destinatario: typeof msg.destinatario === "object" ? msg.destinatario.nome : msg.destinatario,
      imagem: msg.imagem || null,
      arquivo: msg.arquivo || null,
      arquivoNome: msg.arquivoNome || null,
      arquivoTipo: msg.arquivoTipo || null,
    };

    const outro = novoMsg.remetente === usuario.nome ? novoMsg.destinatario : novoMsg.remetente;

    // ✅ Adiciona sempre no histórico local
    const historicoAtual = pegarHistorico(outro);
    const novoHistorico = [...historicoAtual, novoMsg];
    salvarHistorico(outro, novoHistorico);

    // ✅ Atualiza histórico se estiver visualizando a conversa
    if (outro === destinatario) setHistorico(novoHistorico);

    // ✅ Atualiza a lista de conversas sempre
    atualizarConversas();

    // Notificação e contagem de não lidas
    if (novoMsg.remetente !== usuario.nome) {
      toast.info(`📩 Nova mensagem de ${novoMsg.remetente}`, { toastId: novoMsg.data || undefined });

      const chave = gerarChaveChat(usuario.nome, outro);
      const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
      if (!status[chave]) status[chave] = {};
      status[chave][usuario.nome] = (status[chave][usuario.nome] || 0) + 1;
      localStorage.setItem("statusMensagens", JSON.stringify(status));
    }
  } catch (e) {
    console.warn("Erro handleReceive:", e);
  }
};

  socket.on("receiveMessage", handleReceive);

  return () => {
    socket.off("receiveMessage", handleReceive);
    try { socket.disconnect(); } catch {}
    if (window.socket === socket) window.socket = null;
    socketRef.current = null;
  };
}, [usuario?.id, usuario?.nome, destinatario, pegarHistorico, salvarHistorico, atualizarConversas]);

// -----------------------
// Funções principais
// -----------------------
const enviarMensagem = useCallback(() => {
  if ((!mensagem || !mensagem.trim()) && !arquivoBase64) return toast.error("Mensagem vazia.");
  if (!destinatario || !destinatario.trim()) return toast.error("Selecione uma conversa");

  const novaMsg = {
    id: Date.now(),
    texto: mensagem?.trim() || null,
    conteudo: mensagem?.trim() || null,
    remetente: usuario?._id || usuario?.nome || "Anon",
    destinatario,
    data: new Date().toISOString(),
    tipo: arquivoBase64
      ? arquivoTipo?.startsWith("image/") ? "imagem" : "arquivo"
      : "texto",
    imagem: arquivoBase64 && arquivoTipo?.startsWith("image/") ? arquivoBase64.split(",")[1] || arquivoBase64 : null,
    arquivo: arquivoBase64 && !arquivoTipo?.startsWith("image/") ? arquivoBase64.split(",")[1] || arquivoBase64 : null,
    arquivoNome,
    arquivoTipo,
  };

  try { socketRef.current?.emit("novaMensagem", novaMsg); } catch {}
  fetch(`${API_URL}/chat/enviar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
    body: JSON.stringify({
      remetente: novaMsg.remetente,
      destinatario: novaMsg.destinatario,
      conteudo: novaMsg.texto,
      imagem: novaMsg.imagem,
      arquivo: novaMsg.arquivo,
      arquivoNome: novaMsg.arquivoNome,
      arquivoTipo: novaMsg.arquivoTipo,
    }),
  }).catch(() => {});

  const historicoAtual = pegarHistorico(destinatario) || [];
  const novoHistorico = [...historicoAtual, novaMsg];
  salvarHistorico(destinatario, novoHistorico);
  setHistorico(novoHistorico);
  atualizarConversas();

  try {
    const chave = gerarChaveChat(usuario?.nome || "Anon", destinatario);
    const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
    if (!status[chave]) status[chave] = {};
    status[chave][destinatario] = (status[chave][destinatario] || 0) + 1;
    localStorage.setItem("statusMensagens", JSON.stringify(status));
  } catch {}

  setMensagem(""); setArquivoBase64(null); setArquivoNome(null); setArquivoTipo(null);
  if (inputFileRef.current) inputFileRef.current.value = "";
  setStatusDigitando(false);
}, [mensagem, destinatario, arquivoBase64, arquivoTipo, arquivoNome, usuario, pegarHistorico, salvarHistorico, atualizarConversas]);

const abrirConversa = useCallback(async (nomeContato) => {
  if (!nomeContato || !usuario?.nome) return;
  const nomeTrim = String(nomeContato).trim();
  if (!nomeTrim) return;

  setDestinatario(nomeTrim); setAtual(nomeTrim);

  let dados = [];
  try {
    const res = await fetch(
      `${API_URL}/chat/historico/${encodeURIComponent(usuario.nome)}/${encodeURIComponent(nomeTrim)}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    dados = res.ok ? await res.json() : pegarHistorico(nomeTrim);
  } catch { dados = pegarHistorico(nomeTrim); }

  const msgsNormalizadas = dados.map((m) => ({
    ...m,
    texto: m.texto || m.conteudo || "",
    remetente: typeof m.remetente === "object" ? m.remetente.nome : m.remetente,
    destinatario: typeof m.destinatario === "object" ? m.destinatario.nome : m.destinatario,
    arquivo: m.arquivo || null,
    imagem: m.imagem || null,
    arquivoNome: m.arquivoNome || null,
    arquivoTipo: m.arquivoTipo || null,
  }));

  setHistorico(msgsNormalizadas);
  salvarHistorico(nomeTrim, msgsNormalizadas);
  marcarComoLida(nomeTrim);
  atualizarConversas();
}, [usuario?.nome, pegarHistorico, salvarHistorico, marcarComoLida, atualizarConversas]);

// -----------------------
// Digitando
// -----------------------
const setStatusDigitando = useCallback((digitandoBool) => {
  if (!destinatario || !usuario?.nome) return;
  const key = `digitando_${gerarChaveChat(usuario.nome, destinatario)}`;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ digitando: Boolean(digitandoBool), usuario: usuario.nome, data: new Date().toISOString() })
    );
  } catch {}
}, [destinatario, usuario?.nome, gerarChaveChat]);

useEffect(() => {
  if (!destinatario || !usuario?.nome) { setDigitandoDe(null); return; }
  const key = `digitando_${gerarChaveChat(usuario.nome, destinatario)}`;
  const interval = setInterval(() => {
    try {
      const s = JSON.parse(localStorage.getItem(key));
      if (s?.digitando && s?.usuario === destinatario) setDigitandoDe(destinatario);
      else setDigitandoDe(null);
    } catch { setDigitandoDe(null); }
  }, 500); // mais responsivo
  return () => clearInterval(interval);
}, [destinatario, usuario?.nome, gerarChaveChat]);

// Inputs
const handleMensagemChange = (e) => {
  setMensagem(e.target.value);
  setStatusDigitando(true);
  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  typingTimeoutRef.current = setTimeout(() => setStatusDigitando(false), 1500);
};

  const handleArquivoChange = (event) => {
    const file = event.target?.files?.[0]; if (!file) return;
    const tipoOK = tiposAceitos.some((t) => t.endsWith("/*") ? file.type.startsWith(t.split("/")[0] + "/") : file.type === t);
    if (!tipoOK) return toast.error("Tipo de arquivo não suportado.");

    const reader = new FileReader();
    reader.onloadend = () => {
  if (!reader.result) return;
  setArquivoBase64(reader.result); // mantém o DataURL completo
  setArquivoNome(file.name);
  setArquivoTipo(file.type);
};
    reader.readAsDataURL(file);
  };

  // -----------------------
  // Scroll e atualização
  // -----------------------
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [historico]);
  useEffect(() => { atualizarConversas(); }, [atualizarConversas, usuarioActual]);

  // -----------------------
  // Funções UI
  // -----------------------
  const toggleSelecionarConversa = (nome) => {
    setConversasSelecionadas((prev) => {
      const novo = new Set(prev); novo.has(nome) ? novo.delete(nome) : novo.add(nome); return novo;
    });
  };

  const apagarConversasSelecionadas = () => {
    if (conversasSelecionadas.size === 0) return toast.info("Nenhuma conversa selecionada para apagar.");
    if (!window.confirm(`Tem certeza que deseja apagar ${conversasSelecionadas.size} conversa(s)?`)) return;

    const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
    conversasSelecionadas.forEach((nome) => { const chave = gerarChaveChat(usuario?.nome, nome); localStorage.removeItem(chave); delete status[chave]; });
    localStorage.setItem("statusMensagens", JSON.stringify(status));
    setConversasSelecionadas(new Set());
    atualizarConversas();
    if (conversasSelecionadas.has(atual)) { setAtual(null); setDestinatario(""); setHistorico([]); }
    toast.success("Conversa(s) apagada(s) com sucesso.");
  };

  const fazerBackupConversas = () => {
    try {
      const backup = {};
      Object.keys(localStorage).forEach((chave) => {
        if (!chave.includes("_")) return;
        const partes = chave.split("_");
        if (partes.length !== 2) return;
        if (partes.includes(usuario?.nome)) { try { backup[chave] = JSON.parse(localStorage.getItem(chave)); } catch {} }
      });
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const link = document.createElement("a");
      link.href = dataStr;
      link.download = `backup_conversas_${usuario?.nome || "user"}_${new Date().toISOString()}.json`;
      link.click();
      toast.success("Backup das conversas exportado com sucesso.");
    } catch { toast.error("Erro ao gerar backup."); }
  };

  const adicionarEmoji = (emoji) => {
    if (!destinatario) return;
    const novaMsg = { id: Date.now(), texto: emoji, remetente: usuario.nome, destinatario, data: new Date().toISOString(), imagem: null, arquivo: null };
    const historicoAtual = pegarHistorico(destinatario);
    const novoHistorico = [...historicoAtual, novaMsg];
    salvarHistorico(destinatario, novoHistorico);
    setHistorico(novoHistorico);
    socketRef.current?.emit("sendMessage", novaMsg);
    fetch(`${API_URL}/chat/enviar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ remetente: novaMsg.remetente, destinatario: novaMsg.destinatario, conteudo: novaMsg.texto }),
    }).catch(() => {});
  };

  // -----------------------
  // Render
  // -----------------------
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable />
      <div className="flex h-[80vh] border rounded overflow-hidden">
        {/* Coluna de conversas */}
        <div className="w-80 border-r p-2 bg-gray-100 flex flex-col">
          {/* Botões de ações */}
          <div className="mb-2 flex gap-2">
            <button type="button" className="bg-yellow-400 text-white px-2 py-0.5 rounded flex-1"
              onClick={() => {
                const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
                Object.keys(status).forEach((chave) => {
                  if (chave.includes(usuario?.nome || "")) { status[chave][usuario?.nome] = 0; status[chave].vistoPor = status[chave].vistoPor || {}; status[chave].vistoPor[usuario?.nome] = true; }
                });
                localStorage.setItem("statusMensagens", JSON.stringify(status));
                atualizarConversas();
                toast.success("Todas as mensagens marcadas como lidas.");
              }}>Marcar todas como lidas</button>

            <button type="button" className="bg-red-600 text-white px-2 py-0.5 rounded disabled:opacity-50 flex-1" disabled={conversasSelecionadas.size === 0} onClick={apagarConversasSelecionadas}>
              Apagar selecionadas ({conversasSelecionadas.size})
            </button>

            <button type="button" className="bg-blue-600 text-white px-2 py-0.5 rounded flex-1" onClick={fazerBackupConversas}>
              Exportar Backup JSON
            </button>
          </div>

          {/* Input nova conversa */}
          <div className="mb-4">
            <input type="text" placeholder="Iniciar nova conversa" value={destinatario} onChange={(e) => setDestinatario(e.target.value)}
              className="w-full p-1 border rounded mb-1 focus:outline-none focus:ring-2 focus:ring-green-400" />
            <button onClick={() => abrirConversa(destinatario)} className="w-full bg-green-500 text-white py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={!destinatario.trim()} type="button">
              Iniciar
            </button>
          </div>

          {/* Lista de conversas */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(80vh - 160px)" }}>
            {conversasRecentes.length === 0 ? <div className="text-gray-500 text-sm">Sem conversas recentes</div> : conversasRecentes.map((conversa, idx) => (
              <div key={idx} className="flex items-center px-2 py-1 hover:bg-green-200 rounded cursor-pointer">
                <input type="checkbox" checked={conversasSelecionadas.has(conversa.nome)} onChange={() => toggleSelecionarConversa(conversa.nome)} className="mr-2" />
                <button type="button" className={`flex-1 text-left focus:outline-none ${conversa.nome === atual ? "font-semibold" : ""}`} onClick={() => abrirConversa(conversa.nome)}>
                  <div className="flex justify-between items-center">
                    <span>{conversa.nome}</span>
                    {conversa.temNaoLidas && <span className="bg-red-600 text-white text-xs px-2 rounded-full select-none">{conversa.countNaoLidas}</span>}
                  </div>
                  <div className="text-xs truncate text-gray-600">{conversa.ultimaMensagem}</div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 flex flex-col p-3">
          {!destinatario ? <div className="flex items-center justify-center h-full text-gray-500 text-lg">Selecione ou inicie uma conversa</div> : (
            <>
              <div className="mb-1 font-semibold text-lg border-b pb-1">Conversa com: {destinatario}</div>
              {digitandoDe === destinatario && <div className="text-sm text-gray-500 italic">Digitando...</div>}
              <div ref={scrollRef} className="flex-1 overflow-y-auto border rounded p-2 mb-2 bg-white" style={{ minHeight: "300px" }}>
                {historico.length === 0 && <div className="text-center text-gray-400 mt-20">Sem mensagens</div>}
                {historico.map((msg, idx) => {
                  if (msg.tipo === "sistema") return (
                    <div key={idx} className="my-3 text-center">
                      <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg shadow">{msg.conteudo || msg.texto}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{msg.data ? new Date(msg.data).toLocaleString() : ""}</div>
                    </div>
                  );
                  const isRemetente = msg.remetente === usuario?.nome;
                  return (
                    <div key={idx} className={`mb-3 flex flex-col ${isRemetente ? "items-end" : "items-start"}`}>
                      <div className={`inline-block rounded px-3 py-2 max-w-xs break-words ${isRemetente ? "bg-green-200 text-green-900" : "bg-gray-200 text-gray-900"}`}>
                        {msg.tipo === "texto" && <div>{msg.conteudo || msg.texto}</div>}
                        {msg.tipo === "imagem" && <img src={msg.imagem} alt={msg.arquivoNome || "imagem enviada"} className="max-w-full max-h-64 mt-1 rounded" />}
                        {msg.tipo === "arquivo" && <a href={msg.arquivo} download={msg.arquivoNome} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">📎 {msg.arquivoNome || "Baixar arquivo"}</a>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{msg.data ? new Date(msg.data).toLocaleString() : ""}</div>
                    </div>
                  );
                })}
              </div>

              {/* Inputs e controles */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={mensagem} onChange={handleMensagemChange} placeholder="Escreva sua mensagem..." className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
                <input type="file" ref={inputFileRef} onChange={handleArquivoChange} accept={tiposAceitos.join(",")} className="hidden" id="input-arquivo-chat" />
                <label htmlFor="input-arquivo-chat" className="cursor-pointer flex items-center justify-center px-3 py-2 border rounded bg-gray-200 hover:bg-gray-300 select-none" title="Enviar arquivo">📎</label>
                <button onClick={enviarMensagem} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!mensagem.trim() && !arquivoBase64} type="button">Enviar</button>
              </div>

              {/* Preview do arquivo */}
              {arquivoBase64 && <div className="mt-2 text-sm text-gray-700 flex items-center gap-2">
                <span>Arquivo selecionado: <strong>{arquivoNome}</strong></span>
                <button onClick={() => { setArquivoBase64(null); setArquivoNome(null); setArquivoTipo(null); if (inputFileRef.current) inputFileRef.current.value = ""; }} type="button" className="text-red-600 hover:underline" title="Remover arquivo">×</button>
              </div>}

              {/* Emojis */}
              <div className="mt-2 flex gap-1 flex-wrap">{emojisDisponiveis.map((emoji, idx) => (<button key={idx} onClick={() => adicionarEmoji(emoji)} type="button" className="text-xl focus:outline-none hover:bg-green-200 rounded px-1">{emoji}</button>))}</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
