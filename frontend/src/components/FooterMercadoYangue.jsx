// FooterMercadoYangue.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, HelpCircle, BookOpen, Heart, Info } from "lucide-react";

export default function FooterMercadoYangue({ setAbaAtiva }) {
  const [showModal, setShowModal] = useState(false);
  const [avaliacao, setAvaliacao] = useState(0);
  const [comentario, setComentario] = useState("");
  const [nome, setNome] = useState("");
  const [testemunhos, setTestemunhos] = useState([]);

  // 🔹 Detectar ambiente (local ou remoto)
  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:5000/api"
      : "https://mercadoyangue-i3in.onrender.com/api";

  const API_URL = `${API_BASE}/avaliacoes`;

  // 🔸 Carregar avaliações do backend
  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar avaliações");
        return res.json();
      })
      .then((data) => setTestemunhos(data))
      .catch((err) => console.warn("⚠️ Não foi possível carregar avaliações:", err.message));
  }, [API_URL]);

  // 🔸 Enviar nova avaliação
  const handleEnviar = async () => {
    if (avaliacao === 0 || comentario.trim() === "") return;

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
      } else {
        alert("Erro ao enviar avaliação. Tente novamente.");
      }
    } catch (err) {
      console.error("❌ Falha de conexão com o servidor:", err);
      alert("Falha de conexão com o servidor.");
    }
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      className="relative bg-gradient-to-b from-green-800 to-green-900 text-green-100 py-14 mt-16 shadow-xl overflow-hidden"
    >
      {/* Luz animada */}
      <motion.div
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-10 bg-gradient-to-r from-green-300 via-yellow-200 to-green-400 bg-[length:200%_200%]"
      />

      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 z-10">
        {/* 🟧 O que dizem sobre nós */}
        <div className="md:col-span-1 bg-white rounded-2xl shadow-md p-6 text-green-900 w-full flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4">O que dizem sobre nós 💬</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-green-100 pr-2">
              {testemunhos.length > 0 ? (
                testemunhos.map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-green-50 rounded-lg p-3 text-sm shadow-sm border border-green-100"
                  >
                    <p className="italic text-green-700 mb-1">“{t.texto}”</p>
                    <div className="flex items-center justify-between text-xs text-green-600">
                      <span>— {t.nome}</span>
                      <span>{"⭐".repeat(t.estrelas)}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-green-600 italic">
                  Ainda sem avaliações. Seja o primeiro a deixar a sua opinião!
                </p>
              )}
            </div>
          </div>

          {/* 🔸 Botão Avaliar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowModal(true)}
            className="mt-6 bg-yellow-400 text-green-900 font-semibold px-5 py-3 rounded-lg hover:bg-yellow-300 transition flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5" /> Avalia a Plataforma
          </motion.button>
        </div>

        {/* 🟩 Restante (Ajuda, Guia, Contactos) */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sobre */}
          <div className="flex flex-col items-start">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setAbaAtiva("quemSomos")}
              className="flex items-center gap-3 bg-white text-green-800 font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-green-50 transition text-base"
            >
              <Info className="w-5 h-5 text-green-700" />
              Sobre o MercadoYangue
            </motion.button>

            <p className="text-sm text-green-300 mt-3 max-w-xs leading-relaxed">
              Plataforma digital angolana que conecta produtores, vendedores e consumidores, promovendo o comércio justo e a inovação local.
            </p>
          </div>

          {/* Ajuda & Guia */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-200">Ajuda & Guia</h3>
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setAbaAtiva("ajuda")}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 px-4 py-2 rounded text-sm text-green-900 font-semibold transition shadow-sm"
              >
                <HelpCircle className="w-4 h-4" /> Ajuda Interactiva
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setAbaAtiva("guia")}
                className="flex items-center gap-2 bg-amber-800 hover:bg-amber-700 px-4 py-2 rounded text-sm text-white font-semibold transition shadow-sm"
              >
                <BookOpen className="w-4 h-4" /> Guia de Utilização
              </motion.button>

              <p className="text-xs text-green-300 mt-2 leading-relaxed">
                Passos detalhados sobre como comprar, vender e gerir produtos no MercadoYangue.
              </p>
            </div>
          </div>

          {/* Contactos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-200">Contacte-nos</h3>
            <ul className="text-sm text-green-200 space-y-1">
              <li>📧 contato@mercadoyangue.co.ao</li>
              <li>📧 suporte@mercadoyangue.co.ao</li>
              <li>📧 info@mercadoyangue.co.ao</li>
              <li>📧 atendimento@mercadoyangue.co.ao</li>
              <li>📞 +244 920 000 000</li>
            </ul>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="md:col-span-3 text-center border-t border-green-800 pt-6 mt-6">
          <p className="text-sm text-green-400">
            © 2025 MercadoYangue Serviços Digitais — Criado por angolanos, para angolanos 🇦🇴
          </p>
        </div>
      </div>

      {/* 🔹 Modal de Avaliação */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-2xl p-6 w-11/12 md:w-96 text-center shadow-2xl"
            >
              <div className="flex justify-end">
                <button onClick={() => setShowModal(false)}>
                  <X className="text-green-700 hover:text-red-500" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-green-800 mb-3">
                Avalia o MercadoYangue 🌿
              </h3>

              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Teu nome (ou deixa em branco para anónimo)"
                className="w-full border border-green-300 rounded-lg p-2 text-sm text-black mb-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />

              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    onClick={() => setAvaliacao(n)}
                    className={`cursor-pointer w-6 h-6 ${
                      n <= avaliacao ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Deixa o teu comentário..."
                className="w-full border border-green-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-green-500 focus:outline-none mb-4"
              ></textarea>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleEnviar}
                className="bg-green-700 text-white px-4 py-2 rounded-lg w-full font-semibold hover:bg-green-600 transition"
              >
                Enviar Avaliação
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.footer>
  );
}