import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Rocket,
  Users,
  Shield,
  Lightbulb,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AbaGuiaUtilizacao() {
  const [openIndex, setOpenIndex] = useState(null);
  const [dicaDia, setDicaDia] = useState("");

  // Dicas aleatórias
  const dicas = [
    "Produtos com fotos tiradas à luz natural vendem até 2x mais rápido.",
    "Responde às mensagens em menos de 10 minutos — isso dobra as tuas chances de venda.",
    "Actualiza os teus preços semanalmente para aparecer nas pesquisas recentes.",
    "Fotos horizontais mostram melhor o produto e atraem mais cliques.",
    "Adiciona uma descrição clara com peso, origem e validade para transmitir confiança.",
    "Usa o selo Confiança Yangue para destacar o teu perfil e atrair mais compradores.",
  ];

  useEffect(() => {
    const dicaRandom = dicas[Math.floor(Math.random() * dicas.length)];
    setDicaDia(dicaRandom);
  }, []);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      icon: <Rocket className="text-green-700 h-6 w-6" />,
      title: "1️⃣ Primeiros Passos",
      content: (
        <>
          Cria a tua conta e explora as categorias.  
          Tudo foi desenhado para funcionar rápido até em rede móvel.  
          Experimenta pesquisar por <strong>“tomates”</strong>, <strong>“mel”</strong>, <strong>“ovos”</strong> ou <strong>“peixe fresco”</strong>.
        </>
      ),
    },
    {
      icon: <Users className="text-green-700 h-6 w-6" />,
      title: "2️⃣ Para Vendedores",
      content: (
        <>
          Cadastra produtos com fotos reais e preços justos.  
          Responde rápido aos clientes e ganha o selo <strong>“Confiança Yangue”</strong>.
        </>
      ),
    },
    {
      icon: <Shield className="text-green-700 h-6 w-6" />,
      title: "3️⃣ Segurança",
      content: (
        <>
          Negocia sempre dentro da plataforma e evita transferências fora.  
          A nossa equipa monitoriza anúncios para manter a confiança e a transparência no mercado.
        </>
      ),
    },
    {
      icon: <Lightbulb className="text-green-700 h-6 w-6" />,
      title: "💡 Dica do Dia",
      content: (
        <>
          <strong>{dicaDia}</strong>
        </>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-6">
      {/* Cabeçalho */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-3xl font-bold text-green-800 mb-6 flex items-center gap-2"
      >
        <BookOpen className="h-8 w-8 text-green-700" />
        Guia Interactivo do MercadoYangue
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-green-900 mb-8 leading-relaxed"
      >
        Este guia foi feito para te ajudar a tirar o máximo do <strong>MercadoYangue</strong>.  
        Aqui conectamos produtores, vendedores e consumidores de toda Angola 🇦🇴.
      </motion.p>

      {/* FAQ dinâmico */}
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            layout
            className="bg-green-50 border border-green-200 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-green-100 transition focus:outline-none"
            >
              <div className="flex items-center gap-3">
                {faq.icon}
                <h3 className="font-semibold text-green-800">{faq.title}</h3>
              </div>
              {openIndex === index ? (
                <ChevronUp className="text-green-700" />
              ) : (
                <ChevronDown className="text-green-700" />
              )}
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-5 pb-4 text-green-700 text-sm leading-relaxed"
                >
                  {faq.content}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="mt-10 text-center border-t border-green-200 pt-4">
        <CheckCircle className="mx-auto text-green-700 h-10 w-10 mb-2" />
        <p className="text-green-800 text-sm">
          © 2025 MercadoYangue Serviços Digitais — Criado por angolanos, para angolanos 🇦🇴
        </p>
      </div>
    </div>
  );
}



