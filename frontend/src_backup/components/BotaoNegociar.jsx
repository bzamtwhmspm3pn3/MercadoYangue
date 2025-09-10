// src/components/BotaoNegociar.jsx
import { useNavigate } from "react-router-dom";

export default function BotaoNegociar({ comprador, vendedor, produto }) {
  const navigate = useNavigate();

  const negociar = () => {
    const mensagem = `Olá, estou interessado no seu produto: ${produto.nome}. Podemos negociar?`;

    const payload = {
      vendedor: vendedor.nome,
      mensagem,
      de: comprador,
    };

    localStorage.setItem("mensagemPreChat", JSON.stringify(payload));
    navigate("/"); // ou `navigate("/chat")` se tiveres rota direta
  };

  return (
    <button
      onClick={negociar}
      className="text-sm text-yellow-700 underline hover:text-yellow-900 transition"
    >
      Negociar com o Vendedor
    </button>
  );
}
