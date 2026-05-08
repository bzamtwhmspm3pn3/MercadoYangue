import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import ConfirmacaoPagamento from "./ConfirmacaoPagamento";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ConfirmacaoPagamentoProtegido({
  carrinho,
  navigateToChat,
  tipoFactura = "manual",
  onSucesso
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
      alert("Usuário não autenticado ou carrinho vazio.");
      return;
    }

    setLoading(true);

    try {
      const metodoPagamento = checkoutData.metodoPagamento || "transferencia";
      const referencia = checkoutData.referencia || `REF-${Date.now()}`;

      // Finalizar carrinho (baixa estoque)
      const resCarrinho = await fetch(`${API_URL}/carrinho/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ metodoPagamento, referencia }),
      });

      const dataCarrinho = await resCarrinho.json();
      if (!resCarrinho.ok) {
        throw new Error(dataCarrinho.msg || "Erro ao finalizar carrinho");
      }

      // Registrar venda
      const resVenda = await fetch(`${API_URL}/vendas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...checkoutData,
          compradorId: usuario._id,
          factura: checkoutData.factura || { tipo: tipoFactura },
        }),
      });

      const dataVenda = await resVenda.json();
      if (!resVenda.ok) {
        console.error("Erro ao registrar venda:", dataVenda);
      }

      // Enviar mensagem para o vendedor
      const mensagem = msgAutomatica || `Olá! Acabei de realizar um pedido. Aguardo confirmação.`;
      
      try {
        await fetch(`${API_URL}/chat/enviar`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            destinatarioId: checkoutData.vendedorId,
            conteudo: mensagem,
          }),
        });
      } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
      }

      // Notificar entregador se houver
      if (checkoutData.entregador) {
        try {
          await fetch(`${API_URL}/chat/enviar`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              destinatarioId: checkoutData.entregador._id,
              conteudo: `Nova entrega solicitada! Cliente: ${usuario.nome}`,
            }),
          });
        } catch (err) {
          console.error("Erro ao notificar entregador:", err);
        }
      }

      setMensagemAutomatica(mensagem);
      setVendedorPrincipal(vendedor);
      setCheckoutConfirmado(true);

      if (typeof onSucesso === "function") {
        onSucesso({ pedido: dataCarrinho, venda: dataVenda });
      }

      alert("Pedido confirmado com sucesso!");
      return { pedido: dataCarrinho, venda: dataVenda };

    } catch (err) {
      console.error("Erro no checkout:", err);
      alert(err.message || "Erro no checkout");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (!token || !usuario) {
    return <div className="text-center p-8">Carregando autenticação...</div>;
  }

  if (!carrinho || carrinho.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-xl shadow">
        <p className="text-gray-500">Carrinho vazio. Adicione produtos antes de finalizar a compra.</p>
      </div>
    );
  }

  return (
    <ConfirmacaoPagamento
      comprador={usuario}
      carrinho={carrinho}
      navigateToChat={navigateToChat}
      onConfirmar={enviarCheckout}
      vendedorPrincipal={carrinho[0]?.vendedor || { _id: carrinho[0]?.vendedorId, nome: "Vendedor" }}
      mensagemAutomatica={mensagemAutomatica}
      checkoutConfirmado={checkoutConfirmado}
      loading={loading}
    />
  );
}
