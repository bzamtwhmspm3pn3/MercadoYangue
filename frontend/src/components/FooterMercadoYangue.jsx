import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, HelpCircle, BookOpen, Heart, Info, Mail, Phone, Globe } from "lucide-react";

export default function FooterMercadoYangue({ setAbaAtiva }) {
  const [showModal, setShowModal] = useState(false);
  const [avaliacao, setAvaliacao] = useState(0);
  const [comentario, setComentario] = useState("");
  const [nome, setNome] = useState("");
  const [testemunhos, setTestemunhos] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://mercadoyangue-i3in.onrender.com/api";
  const API_URL = `${API_BASE}/avaliacoes`;

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar avaliações");
        return res.json();
      })
      .then((data) => {
        setTestemunhos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Erro ao carregar avaliações:", err.message);
        setLoading(false);
      });
  }, [API_URL]);

  const handleEnviar = async () => {
    if (avaliacao === 0 || comentario.trim() === "") {
      alert("Por favor, selecione uma nota e escreva um comentário.");
      return;
    }

    const nova = {
      nome: nome.trim() === "" ? "Visitante" : nome.trim(),
      texto: comentario,
      estrelas: avaliacao,
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nova),
      });

      if (res.ok) {
        const novaAvaliacao = await res.json();
        setTestemunhos([novaAvaliacao, ...testemunhos]);
        setAvaliacao(0);
        setComentario("");
        setNome("");
        setShowModal(false);
        alert("Avaliação enviada com sucesso! Obrigado!");
      } else {
        alert("Erro ao enviar avaliação. Tente novamente.");
      }
    } catch (err) {
      console.error("Falha de conexão:", err);
      alert("Falha de conexão com o servidor.");
    }
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      className="relative bg-gradient-to-b from-green-800 to-green-900 text-green-100 py-12 mt-16 shadow-xl overflow-hidden"
    >
      <motion.div
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-10 bg-gradient-to-r from-green-300 via-yellow-200 to-green-400 bg-[length:200%_200%]"
      />

      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 z-10">
        {/* Coluna 1 - Avaliações */}
        <div className="bg-white rounded-2xl shadow-md p-5 text-green-900">
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Heart className="text-red-500" size={20} /> O que dizem sobre nós
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            ) : testemunhos.length > 0 ? (
              testemunhos.slice(0, 5).map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-green-50 rounded-lg p-3 text-sm shadow-sm border border-green-100"
                >
                  <p className="italic text-green-700 mb-1">“{t.texto.length > 100 ? t.texto.substring(0, 100) + '...' : t.texto}”</p>
                  <div className="flex items-center justify-between text-xs text-green-600">
                    <span>— {t.nome}</span>
                    <span className="flex">{"⭐".repeat(t.estrelas)}{"☆".repeat(5 - t.estrelas)}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-green-600 italic text-center py-4">
                Ainda sem avaliações. Seja o primeiro a deixar a sua opinião!
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowModal(true)}
            className="mt-4 w-full bg-yellow-400 text-green-900 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-300 transition flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" /> Avaliar Plataforma
          </motion.button>
        </div>

        {/* Coluna 2 - Links Rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-200">Informação</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => setAbaAtiva("quemSomos")} className="flex items-center gap-2 bg-green-700 hover:bg-green-600 px-3 py-2 rounded-lg text-sm transition text-left">
                <Info size={16} /> Sobre Nós
              </button>
              <button onClick={() => setAbaAtiva("ajuda")} className="flex items-center gap-2 bg-green-700 hover:bg-green-600 px-3 py-2 rounded-lg text-sm transition text-left">
                <HelpCircle size={16} /> Ajuda Interactiva
              </button>
              <button onClick={() => setAbaAtiva("guia")} className="flex items-center gap-2 bg-green-700 hover:bg-green-600 px-3 py-2 rounded-lg text-sm transition text-left">
                <BookOpen size={16} /> Guia de Utilização
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-200">Links Úteis</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => setAbaAtiva("produtos")} className="text-sm text-green-300 hover:text-white transition text-left">Produtos</button>
              <button onClick={() => setAbaAtiva("logistica")} className="text-sm text-green-300 hover:text-white transition text-left">Entregas</button>
              <button onClick={() => setAbaAtiva("quemSomos")} className="text-sm text-green-300 hover:text-white transition text-left">Quem Somos</button>
              <a href="https://jiampreditivo.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-sm text-green-300 hover:text-white transition">JIAM Preditivo</a>
            </div>
          </div>
        </div>

        {/* Coluna 3 - Contactos */}
        <div className="bg-green-800/50 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3 text-green-200 flex items-center gap-2">
            <Mail size={18} /> Contacte-nos
          </h3>
          <ul className="text-sm text-green-200 space-y-2">
            <li className="flex items-center gap-2"><Mail size={14} /> mercadoyangueservicosdigitais@gmail.com</li>
            <li className="flex items-center gap-2"><Phone size={14} /> +244 928 565 837</li>
            <li className="flex items-center gap-2"><Globe size={14} /> Angola</li>
          </ul>
          <div className="mt-4 pt-3 border-t border-green-700">
            <p className="text-xs text-green-400 text-center">
              © {new Date().getFullYear()} MercadoYangue Serviços Digitais
            </p>
            <p className="text-xs text-green-500 text-center mt-1">
              Criado por angolanos, para angolanos 🇦🇴
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Avaliação */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-11/12 md:w-[450px] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-green-800">Avalie o MercadoYangue</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="text-gray-500 hover:text-red-500" size={20} />
                </button>
              </div>

              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Teu nome (opcional)"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3 focus:ring-2 focus:ring-green-500 outline-none"
              />

              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    onClick={() => setAvaliacao(n)}
                    className={`cursor-pointer w-8 h-8 transition ${
                      n <= avaliacao ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                ))}
              </div>

              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escreva o seu comentário..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3 focus:ring-2 focus:ring-green-500 outline-none resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnviar}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Enviar Avaliação
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.footer>
  );
}