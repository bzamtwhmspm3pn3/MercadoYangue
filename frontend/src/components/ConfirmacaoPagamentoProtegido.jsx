import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import ConfirmacaoPagamento from "./ConfirmacaoPagamento";

export default function ConfirmacaoPagamentoProtegido({
  carrinho,
  navigateToChat,
  tipoFactura = "manual"
}) {
  const { inicializarAuth, token, usuario } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [vendedorPrincipal, setVendedorPrincipal] = useState(null);
  const [mensagemAutomatica, setMensagemAutomatica] = useState("");
  const [checkoutConfirmado, setCheckoutConfirmado] = useState(false);

  useEffect(() => {
    inicializarAuth();
  }, []);

  const enviarCheckout = async (checkoutData, msgAutomatica, vendedor) => {
    if (!usuario || !token || !carrinho.length) {
      alert("⚠️ Usuário não autenticado ou carrinho vazio.");
      return;
    }

    setLoading(true);

    try {
      // --- 1) Registar compra ---
      const res = await await fetch("https://mercadoyangue-i3in.onrender.com/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...checkoutData,
          comprador: usuario._id,
          factura: checkoutData.factura || { tipo: tipoFactura },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Erro no checkout");

      console.log("✅ Compra registrada:", data);

      // --- 2) Enviar mensagem automática ao vendedor ---
      const resMsg = await await fetch("https://mercadoyangue-i3in.onrender.com/api/chat/enviar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destinatario: vendedor._id,   // ID do vendedor
          conteudo: msgAutomatica,      // mensagem formatada no Filho
        }),
      });

      if (!resMsg.ok) {
        const erroMsg = await resMsg.json();
        console.error("❌ Erro ao enviar mensagem:", erroMsg);
      } else {
        console.log("✅ Mensagem automática enviada ao vendedor");
      }

      // --- 3) Atualizar estados para o Filho ---
      setMensagemAutomatica(msgAutomatica);
      setVendedorPrincipal(vendedor);
      setCheckoutConfirmado(true);

    } catch (err) {
      console.error("❌ Erro no fluxo de checkout:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !usuario) return <div>Carregando autenticação...</div>;

  return (
    <ConfirmacaoPagamento
      comprador={usuario}
      carrinho={carrinho}
      navigateToChat={navigateToChat}
      onConfirmar={enviarCheckout}
      vendedorPrincipal={carrinho[0]?.vendedor}
      mensagemAutomatica={mensagemAutomatica}
      checkoutConfirmado={checkoutConfirmado}
      loading={loading}
    />
  );
}
