
import { useEffect, useState, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connectSocket } from "../socket";

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
  const [mensagem, setMensagem] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [historico, setHistorico] = useState([]);
  const [conversasRecentes, setConversasRecentes] = useState([]);
 const [conversasSelecionadas, setConversasSelecionadas] = useState(new Set());
  const [atual, setAtual] = useState(null);
  const [digitando, setDigitando] = useState(false);
  const [digitandoDe, setDigitandoDe] = useState(null);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const ultimaMsgIdRef = useRef(null);
  const [arquivoBase64, setArquivoBase64] = useState(null);
  const [arquivoNome, setArquivoNome] = useState(null);
  const [arquivoTipo, setArquivoTipo] = useState(null);
  const inputFileRef = useRef(null);
  const [usuarioActual, setUsuarioActual] = useState(null);



useEffect(() => {
  if (usuario && usuario.nome) {
    setUsuarioActual(usuario.nome);
  }
}, [usuario]);

  const [remetente, setRemetente] = useState(null);

useEffect(() => {
  const pendente = localStorage.getItem("mensagemPreChat");
  if (!pendente) return;

  try {
    const { vendedor, mensagem, de } = JSON.parse(pendente);

    if (vendedor && mensagem) {
      setDestinatario(vendedor);
      abrirConversa(vendedor);

      const novaMsg = {
        texto: mensagem,
        remetente: de || usuario.nome,
        destinatario: vendedor,
        data: new Date().toISOString(),
        automatica: true,
        imagem: null,
        arquivo: null,
        arquivoNome: null,
        arquivoTipo: null,
      };

      const chave = gerarChaveChat(de || usuario.nome, vendedor);
      const historicoAnterior = pegarHistorico(vendedor);
      const novoHistorico = [...historicoAnterior, novaMsg];

      // Salva no localStorage
      localStorage.setItem(chave, JSON.stringify(novoHistorico));
      setHistorico(novoHistorico);

// 1. Enviar mensagem para o backend
fetch("https://mercadoyangue-i3in.onrender.com/api/chat/enviar", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`, // garante que mandas o JWT
  },
  body: JSON.stringify({
    destinatario,
    conteudo: novaMsg.texto,
  }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log("Mensagem salva no servidor:", data);
  })
  .catch((err) => console.error("Erro ao salvar no servidor:", err));

// 2. Emitir via socket para o destinatário
if (window.socket) {
  window.socket.emit("novaMensagem", {
    remetente: usuario.nome,
    destinatario,
    conteudo: novaMsg.texto,
    data: novaMsg.data,
  });
}

      // Atualiza status de leitura para o vendedor
      const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
      if (!status[chave]) status[chave] = {};
      const outro = (de || usuario.nome) === chave.split("_")[0] ? chave.split("_")[1] : chave.split("_")[0];
      status[chave][outro] = (status[chave][outro] || 0) + 1;
      localStorage.setItem("statusMensagens", JSON.stringify(status));

      // Limpa o preChat
      localStorage.removeItem("mensagemPreChat");
    }
  } catch (e) {
    console.warn("Erro ao carregar e enviar mensagem pendente:", e);
  }
}, []);




// Funções de seleção:
  const toggleSelecionarConversa = (nome) => {
    setConversasSelecionadas((prev) => {
      const novo = new Set(prev);
      if (novo.has(nome)) novo.delete(nome);
      else novo.add(nome);
      return novo;
    });
  };

  const apagarConversasSelecionadas = () => {
    if (conversasSelecionadas.size === 0) {
      toast.info("Nenhuma conversa selecionada para apagar.");
      return;
    }
    if (!window.confirm(`Tem certeza que deseja apagar ${conversasSelecionadas.size} conversa(s)?`)) return;

    const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
    conversasSelecionadas.forEach((nome) => {
      const chave = gerarChaveChat(usuario.nome, nome);
      localStorage.removeItem(chave);
      delete status[chave];
    });
    localStorage.setItem("statusMensagens", JSON.stringify(status));
    setConversasSelecionadas(new Set());
    atualizarConversas();
    if (conversasSelecionadas.has(atual)) {
      setAtual(null);
      setDestinatario("");
      setHistorico([]);
    }
    toast.success("Conversa(s) apagada(s) com sucesso.");
  };

  const fazerBackupConversas = () => {
    try {
      const backup = {};
      Object.keys(localStorage).forEach((chave) => {
  if (!chave.includes("_")) return;
  const partes = chave.split("_");
  if (partes.length !== 2) return;
  if (partes.includes(usuario.nome)) {
          backup[chave] = JSON.parse(localStorage.getItem(chave));
        }
      });
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const link = document.createElement("a");
      link.href = dataStr;
      link.download = `backup_conversas_${usuario.nome}_${new Date().toISOString()}.json`;
      link.click();
      toast.success("Backup das conversas exportado com sucesso.");
    } catch {
      toast.error("Erro ao gerar backup.");
    }
  };


  const gerarChaveChat = useCallback((nome1, nome2) => {
    return [nome1, nome2].sort().join("_");
  }, []);

  const pegarHistorico = useCallback(
    (dest) => {
      const chave = gerarChaveChat(usuario.nome, dest);
      try {
        const dados = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(dados) ? dados : [];
      } catch {
        return [];
      }
    },
    [usuario.nome, gerarChaveChat]
  );

  const marcarComoLida = useCallback(
    (dest) => {
      const chave = gerarChaveChat(remetente, destinatario);
      try {
        const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
        if (status[chave]?.[usuario.nome] > 0) {
          status[chave][usuario.nome] = 0;
          status[chave].vistoPor = status[chave].vistoPor || {};
          status[chave].vistoPor[usuario.nome] = true;
          localStorage.setItem("statusMensagens", JSON.stringify(status));
        }
      } catch {}
    },
    [usuario.nome, gerarChaveChat]
  );

  const atualizarConversas = useCallback(() => {
  try {
    const chaves = Object.keys(localStorage);
    const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
    const conversas = [];

    chaves.forEach((chave) => {
      if (!chave.includes("_")) return;
      const [n1, n2] = chave.split("_");
      if (n1 !== usuario.nome && n2 !== usuario.nome) return;

      // ⛔ Ignorar nomes inválidos
      const outro = n1 === usuario.nome ? n2 : n1;
      if (!outro || ["chat", "digitando", "undefined", "null", ""].includes(outro.toLowerCase())) return;

      const historico = pegarHistorico(outro);
      if (!Array.isArray(historico)) return;

      const ultimaMensagem = [...historico].reverse().find(msg => !!msg.texto || !!msg.imagem || !!msg.arquivo) || {};

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
  } catch {
    setConversasRecentes([]);
  }
}, [usuario.nome, pegarHistorico]);

  const abrirConversa = useCallback(
    (nomeContato) => {
      if (!nomeContato.trim()) return;
      setDestinatario(nomeContato);
      const dados = pegarHistorico(nomeContato);
      setHistorico(dados);
      setAtual(nomeContato);
      marcarComoLida(nomeContato);
    },
    [marcarComoLida, pegarHistorico]
  );

  // 1) Ajuste na leitura do historico — use sempre gerarChaveChat para pegar a mesma chave

useEffect(() => {
  if (!destinatario || !usuarioActual) return;
  const chave = gerarChaveChat(usuarioActual, destinatario);
  const historico = JSON.parse(localStorage.getItem(chave)) || [];
  setHistorico(historico);
}, [destinatario, usuarioActual, gerarChaveChat]);

// 2) Ajuste na lógica de digitando
useEffect(() => {
  if (!destinatario) {
    setDigitandoDe(null);
    return;
  }

  const interval = setInterval(() => {
    const key = `digitando_${gerarChaveChat(usuario.nome, destinatario)}`;
    try {
      const status = JSON.parse(localStorage.getItem(key) || "{}");
      if (status.digitando && status.usuario === destinatario) {
        setDigitandoDe(destinatario);
      } else {
        setDigitandoDe(null);
      }
    } catch {
      setDigitandoDe(null);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [destinatario, usuario.nome, gerarChaveChat]);

// E no setStatusDigitando, grave da mesma forma:
const setStatusDigitando = useCallback(
  (digitandoBool) => {
    if (!destinatario) return;
    const key = `digitando_${gerarChaveChat(usuario.nome, destinatario)}`;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          digitando: digitandoBool,
          usuario: usuario.nome,
          data: new Date().toISOString()
        })
      );
    } catch {}
  },
  [destinatario, usuario.nome, gerarChaveChat]
);


  const handleMensagemChange = (e) => {
    setMensagem(e.target.value);
    setStatusDigitando(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setStatusDigitando(false);
    }, 2000);
  };

  const handleArquivoChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

    const extensao = file.name.split(".").pop().toLowerCase();
    const tiposValidos = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "gif"];

    if (!tiposAceitos.some((tipo) => file.type.match(tipo.replace("*", ".*")))) {
    toast.error("Tipo de arquivo não suportado.");
    return;
  }

    const reader = new FileReader();
    reader.onloadend = () => {
      setArquivoBase64(reader.result);
      setArquivoNome(file.name);
      setArquivoTipo(file.type);
    };
    reader.readAsDataURL(file);
  };

  const enviarMensagem = () => {
  if (!mensagem.trim() && !arquivoBase64) return;
  if (!destinatario.trim()) {
    toast.error("Selecione ou inicie uma conversa antes de enviar.");
    return;
  }

  const novaMsg = {
    texto: mensagem.trim(),
    remetente: usuario.nome,
    destinatario,
    data: new Date().toISOString(),
    automatica: false,
    imagem: null,
    arquivo: null,
    arquivoNome: null,
    arquivoTipo: null,
  };

  if (arquivoBase64) {
    if (arquivoTipo.startsWith("image/")) {
      novaMsg.imagem = arquivoBase64;
    } else {
      novaMsg.arquivo = arquivoBase64;
      novaMsg.arquivoNome = arquivoNome;
      novaMsg.arquivoTipo = arquivoTipo;
    }
  }

  // Ajuste: gerar a chave com os nomes ordenados para evitar chaves duplicadas inversas
  const chave = gerarChaveChat(usuario.nome, destinatario);
  
  // Ajuste: passar a chave correta para pegarHistorico para obter o histórico certo
  const historicoAnterior = pegarHistorico(destinatario);
  const novoHistorico = [...historicoAnterior, novaMsg];

  try {
    localStorage.setItem(chave, JSON.stringify(novoHistorico));

    const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
    if (!status[chave]) status[chave] = {};
const nomes = chave.split("_");
const outro = nomes[0] === usuario.nome ? nomes[1] : nomes[0];
status[chave][outro] = (status[chave][outro] || 0) + 1;
    localStorage.setItem("statusMensagens", JSON.stringify(status));
  } catch {}

  setMensagem("");
  setArquivoBase64(null);
  setArquivoNome(null);
  setArquivoTipo(null);
  setHistorico(novoHistorico);
  atualizarConversas();
  setStatusDigitando(false);

  if (inputFileRef.current) inputFileRef.current.value = "";
};

const adicionarEmoji = (emoji) => {
  setMensagem((prev) => prev + emoji);
};
  useEffect(() => {
    if (!destinatario) return;

    const intervalo = setInterval(() => {
      const dados = pegarHistorico(destinatario);

      if (JSON.stringify(dados) !== JSON.stringify(historico)) {
        setHistorico(dados);
        marcarComoLida(destinatario);
        atualizarConversas();

        const ultimaMsg = dados[dados.length - 1];
        if (
          ultimaMsg &&
          ultimaMsg.remetente !== usuario.nome &&
          ultimaMsg.data !== ultimaMsgIdRef.current
        ) {
          toast.info(`📩 Nova mensagem de ${ultimaMsg.remetente}`, {
            toastId: ultimaMsg.data,
          });
          ultimaMsgIdRef.current = ultimaMsg.data;
        }
      }
    }, 1500);

    return () => clearInterval(intervalo);
  }, [destinatario, historico, marcarComoLida, pegarHistorico, atualizarConversas, usuario.nome]);


  useEffect(() => {
    atualizarConversas();
  }, [atualizarConversas]);

useEffect(() => {
  const participantes = [usuarioActual, destinatario].sort();
  const chave = `chat_${participantes[0]}_${participantes[1]}`;
  const historico = JSON.parse(localStorage.getItem(chave)) || [];
  setHistorico(historico);
}, [destinatario, usuarioActual]);


  useEffect(() => {
  if (scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, [historico]);

  return (
  <>
  <ToastContainer
    position="top-right"
    autoClose={3000}
    hideProgressBar={false}
    newestOnTop={true}
    closeOnClick
    pauseOnHover
    draggable
  />

  <div className="flex h-[80vh] border rounded overflow-hidden">
    {/* Coluna única de Conversas */}
    <div className="w-80 border-r p-2 bg-gray-100 flex flex-col">

      {/* Botões de ação para apagar e backup */}
      <div className="mb-2 flex gap-2">
<button
  type="button"
  className="bg-yellow-400 text-white px-2 py-0.5 rounded flex-1"
  onClick={() => {
    const status = JSON.parse(localStorage.getItem("statusMensagens") || "{}");
    Object.keys(status).forEach((chave) => {
      if (chave.includes(usuario.nome)) {
        status[chave][usuario.nome] = 0;
      }
    });
    localStorage.setItem("statusMensagens", JSON.stringify(status));
    atualizarConversas();
    toast.success("Todas as mensagens marcadas como lidas.");
  }}
>
  Marcar todas como lidas
</button>
   <button
          type="button"
          className="bg-red-600 text-white px-2 py-0.5 rounded disabled:opacity-50 flex-1"
          disabled={conversasSelecionadas.size === 0}
          onClick={apagarConversasSelecionadas}
        >
          Apagar selecionadas ({conversasSelecionadas.size})
        </button>
        <button
          type="button"
          className="bg-blue-600 text-white px-2 py-0.5 rounded flex-1"
          onClick={fazerBackupConversas}
        >
          Exportar Backup JSON
        </button>
      </div>

      {/* Input para nova conversa */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Iniciar nova conversa"
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          className="w-full p-1 border rounded mb-1 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          onClick={() => abrirConversa(destinatario)}
          className="w-full bg-green-500 text-white py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!destinatario.trim()}
          type="button"
        >
          Iniciar
        </button>
      </div>

      {/* Lista de conversas com checkboxes */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(80vh - 160px)' }}>
        {conversasRecentes.length === 0 ? (
          <div className="text-gray-500 text-sm">Sem conversas recentes</div>
        ) : (
          conversasRecentes.map((conversa, idx) => (
            <div
              key={idx}
              className="flex items-center px-2 py-1 hover:bg-green-200 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={conversasSelecionadas.has(conversa.nome)}
                onChange={() => toggleSelecionarConversa(conversa.nome)}
                className="mr-2"
              />
              <button
                type="button"
                className={`flex-1 text-left focus:outline-none ${
                  conversa.nome === atual ? "font-semibold" : ""
                }`}
                onClick={() => abrirConversa(conversa.nome)}
              >
                <div className="flex justify-between items-center">
                  <span>{conversa.nome}</span>
                  {conversa.temNaoLidas && (
                    <span className="bg-red-600 text-white text-xs px-2 rounded-full select-none">
                      {conversa.countNaoLidas}
                    </span>
                  )}
                </div>
                <div className="text-xs truncate text-gray-600">{conversa.ultimaMensagem}</div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>

    {/* Área de Mensagens */}
    <div className="flex-1 flex flex-col p-3">
      {!destinatario ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-lg">
          Selecione ou inicie uma conversa
        </div>
      ) : (
        <>
         <div className="mb-1 font-semibold text-lg border-b pb-1">
  Conversa com: {destinatario || "Selecione uma conversa"}
</div>


{digitandoDe === destinatario && (
  <div className="text-sm text-gray-500 italic">Digitando...</div>
)}

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto border rounded p-2 mb-2 bg-white"
            style={{ minHeight: "300px" }}
          >
                {historico.length === 0 && (
                  <div className="text-center text-gray-400 mt-20">Sem mensagens</div>
                )}
               {historico
  .filter(msg => !(msg.automatica && msg.remetente === usuario.nome))
  .map((msg, idx) => {
                  const isRemetente = msg.remetente === usuario.nome;
                  return (
                    <div
                      key={idx}
                      className={`mb-3 flex flex-col ${
                        isRemetente ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`inline-block rounded px-3 py-2 max-w-xs break-words ${
                          isRemetente
                            ? "bg-green-200 text-green-900"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        {/* Texto da mensagem */}
                        {msg.texto && <div>{msg.texto}</div>}

                        {/* Imagem se existir */}
                        {msg.imagem && (
                          <img
                            src={msg.imagem}
                            alt="imagem enviada"
                            className="max-w-full max-h-64 mt-1 rounded"
                          />
                        )}

                        {/* Arquivo se existir */}
                        {msg.arquivo && (
                          <a
                            href={msg.arquivo}
                            download={msg.arquivoNome}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            📎 {msg.arquivoNome}
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(msg.data).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
                {digitandoDe === destinatario && (
                  <div className="italic text-sm text-gray-600">Está a digitar...</div>
                )}
              </div>

              {/* Input para mensagem e arquivo */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={mensagem}
                  onChange={handleMensagemChange}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <input
                  type="file"
                  ref={inputFileRef}
                  onChange={handleArquivoChange}
                  accept={tiposAceitos.join(",")}
                  className="hidden"
                  id="input-arquivo-chat"
                />
                <label
                  htmlFor="input-arquivo-chat"
                  className="cursor-pointer flex items-center justify-center px-3 py-2 border rounded bg-gray-200 hover:bg-gray-300 select-none"
                  title="Enviar arquivo"
                >
                  📎
                </label>
                <button
                  onClick={enviarMensagem}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!mensagem.trim() && !arquivoBase64}
                  type="button"
                >
                  Enviar
                </button>
              </div>

              {/* Preview do arquivo selecionado */}
              {arquivoBase64 && (
                <div className="mt-2 text-sm text-gray-700 flex items-center gap-2">
                  <span>
                    Arquivo selecionado: <strong>{arquivoNome}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setArquivoBase64(null);
                      setArquivoNome(null);
                      setArquivoTipo(null);
                      if (inputFileRef.current) inputFileRef.current.value = "";
                    }}
                    type="button"
                    className="text-red-600 hover:underline"
                    title="Remover arquivo"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Emojis */}
              <div className="mt-2 flex gap-1 flex-wrap">
                {emojisDisponiveis.map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => adicionarEmoji(emoji)}
                    type="button"
                    className="text-xl focus:outline-none hover:bg-green-200 rounded px-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
