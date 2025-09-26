// src/components/ConfirmacaoPagamentoProtegido.jsx
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import ConfirmacaoPagamento from "./ConfirmacaoPagamento";

export default function ConfirmacaoPagamentoProtegido({
  carrinho,
  navigateToChat,
  tipoFactura = "manual",
  onSucesso // <-- opcional: callback que o AbaCarrinho irá passar para recarregar carrinho/historico
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
    if (!usuario || !token || !carrinho || carrinho.length === 0) {
      alert("⚠️ Usuário não autenticado ou carrinho vazio.");
      return;
    }

    setLoading(true);

    try {
      // 0) Dados para pagamento
      const metodoPagamento = checkoutData.metodoPagamento || "transferencia";
      const referencia = checkoutData.referencia || `REF-${Date.now()}`;

      // 1) Primeiro: chamar a rota do CARRINHO para descontar stock e finalizar carrinho
      const resCarrinho = await fetch("https://mercadoyangue-i3in.onrender.com/api/carrinho/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ metodoPagamento, referencia }),
      });

      const dataCarrinho = await resCarrinho.json();
      if (!resCarrinho.ok) {
        throw new Error(dataCarrinho.msg || "Erro ao finalizar carrinho (checkout)");
      }
      console.log("✅ Carrinho finalizado:", dataCarrinho);

      // 2) Depois: registar venda/compra (sua rota /api/checkout) — opcional mas aparentemente necessária no seu fluxo
      const resVenda = await fetch("https://mercadoyangue-i3in.onrender.com/api/checkout", {
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

      const dataVenda = await resVenda.json();
      if (!resVenda.ok) {
        // Já finalizámos o carrinho no passo 1; aqui apenas reportar o erro (não reverter)
        console.error("⚠️ Erro ao registar venda/compra:", dataVenda);
        // opcional: você pode alertar, mas normalmente queres prosseguir.
      } else {
        console.log("✅ Compra registrada:", dataVenda);
      }

      // 3) Enviar mensagem automática (chat)
      try {
        const resMsg = await fetch("https://mercadoyangue-i3in.onrender.com/api/chat/enviar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            destinatario: vendedor?._id || checkoutData.vendedorId || null,
            conteudo: msgAutomatica,
          }),
        });

        if (!resMsg.ok) {
          const erroMsg = await resMsg.json();
          console.error("❌ Erro ao enviar mensagem:", erroMsg);
        } else {
          console.log("✅ Mensagem automática enviada ao vendedor");
        }
      } catch (err) {
        console.error("❌ Erro no envio de mensagem automática:", err);
      }

      // 4) Atualizar estados locais / informar filho
      setMensagemAutomatica(msgAutomatica);
      setVendedorPrincipal(vendedor);
      setCheckoutConfirmado(true);

      // 5) Notificar o componente pai (AbaCarrinho) para recarregar / atualizar UI
      if (typeof onSucesso === "function") {
        // passa objetos úteis: resultado do carrinho/pedido e da venda (quando existirem)
        onSucesso({ pedido: dataCarrinho.pedido || dataCarrinho, venda: dataVenda || null });
      }

      return { pedido: dataCarrinho.pedido || dataCarrinho, venda: dataVenda || null };

    } catch (err) {
      console.error("❌ Erro no fluxo de checkout:", err);
      alert(err.message || "Erro no checkout");
      throw err;
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
      onConfirmar={enviarCheckout}         // <-- aqui o filho chama enviarCheckout
      vendedorPrincipal={carrinho[0]?.vendedor || { _id: null, nome: "Vendedor" }}
      mensagemAutomatica={mensagemAutomatica}
      checkoutConfirmado={checkoutConfirmado}
      loading={loading}
    />
  );
}
