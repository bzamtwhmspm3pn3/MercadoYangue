// src/components/ConfirmacaoPagamentoProtegido.jsx
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
      alert("⚠️ Usuário não autenticado ou carrinho vazio.");
      return;
    }

    setLoading(true);

    try {
      // Dados para pagamento
      const metodoPagamento = checkoutData?.metodoPagamento || "transferencia";
      const referencia = checkoutData?.referencia || `REF-${Date.now()}`;
      
      // Obter o vendedor do primeiro item do carrinho
      const vendedorId = carrinho[0]?.vendedorId || carrinho[0]?.vendedor?._id;
      const vendedorNome = carrinho[0]?.vendedor?.nome || "Vendedor";

      // 1) Finalizar carrinho (checkout)
      const resCarrinho = await fetch(`${API_URL}/carrinho/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          metodoPagamento, 
          referencia,
          entrega: checkoutData?.entrega || null,
          factura: checkoutData?.factura || { tipo: tipoFactura }
        }),
      });

      const dataCarrinho = await resCarrinho.json();
      if (!resCarrinho.ok) {
        throw new Error(dataCarrinho.msg || "Erro ao finalizar carrinho");
      }
      console.log("✅ Carrinho finalizado:", dataCarrinho);

      // 2) Registrar venda
      const resVenda = await fetch(`${API_URL}/vendas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          compradorId: usuario._id || usuario.id,
          vendedorId: vendedorId,
          itens: carrinho.map(item => ({
            produtoId: item._id || item.produtoId,
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.preco,
            subtotal: item.preco * item.quantidade
          })),
          total: carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0),
          metodoPagamento,
          referencia,
          entrega: checkoutData?.entrega || null,
          status: "confirmado"
        }),
      });

      const dataVenda = await resVenda.json();
      if (!resVenda.ok) {
        console.error("⚠️ Erro ao registrar venda:", dataVenda);
      } else {
        console.log("✅ Venda registrada:", dataVenda);
      }

      // 3) Enviar mensagem automática para o vendedor
      const mensagem = msgAutomatica || `Olá! Acabei de realizar um pedido no valor de ${carrinho.reduce((sum, i) => sum + (i.preco * i.quantidade), 0).toLocaleString()} Kz. ${checkoutData?.entrega ? `Solicitei entrega.` : "Farei a retirada local."} Aguardo confirmação.`;
      
      try {
        const resMsg = await fetch(`${API_URL}/chat/enviar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            destinatarioId: vendedorId,
            conteudo: mensagem,
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

      // 4) Se houver entrega, notificar o entregador
      if (checkoutData?.entrega?.entregadorId) {
        try {
          const msgEntregador = `Nova entrega solicitada! Cliente: ${usuario.nome}. Endereço: ${checkoutData.entrega.endereco || "Combinar"}`;
          await fetch(`${API_URL}/chat/enviar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              destinatarioId: checkoutData.entrega.entregadorId,
              conteudo: msgEntregador,
            }),
          });
          console.log("✅ Mensagem enviada ao entregador");
        } catch (err) {
          console.error("❌ Erro ao notificar entregador:", err);
        }
      }

      // 5) Atualizar estados locais
      setMensagemAutomatica(mensagem);
      setVendedorPrincipal({ _id: vendedorId, nome: vendedorNome });
      setCheckoutConfirmado(true);

      // 6) Notificar o componente pai (AbaCarrinho)
      if (typeof onSucesso === "function") {
        onSucesso({ 
          pedido: dataCarrinho.pedido || dataCarrinho, 
          venda: dataVenda || null 
        });
      }

      alert("✅ Pedido confirmado com sucesso!");
      return { pedido: dataCarrinho.pedido || dataCarrinho, venda: dataVenda || null };

    } catch (err) {
      console.error("❌ Erro no fluxo de checkout:", err);
      alert(err.message || "Erro no checkout. Tente novamente.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (!token || !usuario) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="ml-3 text-gray-600">Carregando autenticação...</p>
      </div>
    );
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