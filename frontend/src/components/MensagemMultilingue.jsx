// src/components/MensagemMultilingue.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const mensagensMultilingues = [
  {
    idioma: "Português",
    texto: "✮ Seja bem-vindo ao Mercado Yangue! Se tens uma orta, quintal, pumar, lavra ou fazenda — aqui é tua praça. Tens peixe, boi, vaca, porco, galinha, pato ou cabrito? Mesmo com só um, vem vender com orgulho. Agricultura, criação, pesca, tudo tem lugar! 🧺🚜",
    cor: "text-yellow-700"
  },
  {
    idioma: "English",
    texto: "🌿 Welcome to Mercado Yangue! Got a garden, backyard or small farm? Do you raise cows, chickens, goats or fish? This is your market — even one item is enough. Agriculture, livestock or aquaculture — all are welcome! 🧺🚚",
    cor: "text-blue-600"
  },
  {
    idioma: "Umbundu",
    texto: "🌱 Ove okuli elonga, ombanda, pumar ou ekamba — lyolyo lyoye. Ove okutwala elombe, etumba, osimbu, okakuku, olondunge, upyala? Elanda vali okuti okutunda — okukwata mosi tye okuli! 🧺🐄🐓🐐🐟",
    cor: "text-red-600"
  },
  {
    idioma: "Kikongo",
    texto: "🍠 Kana kele na buala, nzo, lavra to nsoso — nsoko yeno yina. Kana kele na ngombe, nsusu, mbizi, nkaka to makala — yambula kaka mosi. Nsuka, kulima, kulomba — nyonso ya mona. 🧺🐂🐓🐖🐐",
    cor: "text-purple-600"
  },
  {
    idioma: "Cokwe (Tchokwe)",
    texto: "🌽 Wéé, ulinga ku kalunga, kashitu, pumar to ciwa? Uli na kashumba, ciwa, to ocimenga? Lue lyowe — tunda vali wenda oco. Okusoka, okukala onkinda, onjila – vyote vyatambula. 🧺🐃🐥🐖🐐",
    cor: "text-green-700"
  },
  {
    idioma: "Kimbundu",
    texto: "✮ Ewe mukwenu! Oká na quintal, orta, lavra ou kilumbu? Okuli na boi, vaca, galinha, cabrito, peixe? Yeta! Praça Yangue yé yenu. Mesmo mosi, tunda kwaci. Olongisa, ombianda, ovulima – yina vyose! 🧺🐄🐓🐟🐐",
    cor: "text-pink-700"
  }
];

export default function MensagemMultilingue() {
  const [mensagemActual, setMensagemActual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return;
    const intervalo = setInterval(() => {
      setMensagemActual((prev) => (prev + 1) % mensagensMultilingues.length);
    }, 10000);
    return () => clearInterval(intervalo);
  }, [pausado]);

  const { texto, cor, idioma } = mensagensMultilingues[mensagemActual];

  return (
    <div className="mb-6">
      <motion.div
  key={mensagemActual}
  className={`font-semibold text-center px-4 py-2 max-w-4xl mx-auto ${cor}`}
  initial={{ x: "100%" }}
  animate={pausado ? { x: "0%" } : { x: "-100%" }}
  transition={{ duration: 20, ease: "linear" }}
>
  <span className="block">
    <span className="uppercase text-xs mr-2 bg-white bg-opacity-40 px-2 py-0.5 rounded text-black">
      [{idioma}]
    </span>
    {texto}
  </span>
</motion.div>


      <div className="flex justify-center mt-2 gap-2">
        <button
          onClick={() => setPausado(true)}
          className="bg-yellow-700 hover:bg-yellow-800 text-white text-xs px-3 py-1 rounded"
        >
          ⏸ Pausar
        </button>
        <button
          onClick={() => setPausado(false)}
          className="bg-green-700 hover:bg-green-800 text-white text-xs px-3 py-1 rounded"
        >
          ▶ Retomar
        </button>
        <button
          onClick={() => setMensagemActual((prev) => (prev + 1) % mensagensMultilingues.length)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
        >
          🔁 Próxima
        </button>
      </div>
    </div>
  );
}
