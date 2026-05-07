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

  const enviarCheckout = async (checkoutData) => {
    if (!usuario || !token || !carrinho || carrinho.length === 0) {
      alert("Usuario nao autenticado ou carrinho vazio.");
      return;
    }

    setLoading(true);

    try {
      const metodoPagamento = checkoutData?.metodoPagamento || "transferencia";
      const referencia = checkoutData?.referencia || `REF-${Date.now()}`;
      
      // Obter o vendedor
      const vendedorId = carrinho[0]?.vendedor?._id || carrinho[0]?.vendedorId;
      const vendedorNome = carrinho[0]?.vendedor?.nome || "Vendedor";

      // 1) Finalizar carrinho (checkout)
      const resCarrinho = await fetch(`${API_URL}/carrinho/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          metodoPagamento, 
          referencia,
          entrega: checkoutData?.entregador ? {
            entregadorId: checkoutData.entregador.id,
            entregadorNome: checkoutData.entregador.nome,
            tarifa: checkoutData.entregador.tarifa
          } : null,
          factura: checkoutData?.factura || { tipo: tipoFactura }
        }),
      });

      const dataCarrinho = await resCarrinho.json();
      if (!resCarrinho.ok) {
        throw new Error(dataCarrinho.msg || "Erro ao finalizar carrinho");
      }
      console.log("Carrinho finalizado:", dataCarrinho);

      // 2) Registrar venda
      const totalPedido = carrinho.reduce((sum, item) => sum + ((item.preco || 0) * (item.quantidade || 1)), 0);
      
      const resVenda = await fetch(`${API_URL}/vendas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          compradorId: usuario._id || usuario.id,
          vendedorId: vendedorId,
          itens: carrinho.map(item => ({
            produtoId: item._id || item.produtoId,
            nome: item.nome || "Produto",
            quantidade: item.quantidade || 1,
            precoUnitario: item.preco || 0,
            subtotal: (item.preco || 0) * (item.quantidade || 1)
          })),
          total: totalPedido,
          metodoPagamento,
          referencia,
          entregadorId: checkoutData?.entregador?.id || null,
          status: "confirmado"
        }),
      });

      const dataVenda = await resVenda.json();
      if (!resVenda.ok) {
        console.error("Erro ao registrar venda:", dataVenda);
      }

      // 3) Enviar mensagem para o vendedor
      const mensagemVendedor = `Olá! Acabei de realizar um pedido no valor de ${totalPedido.toLocaleString()} Kz. ${checkoutData?.entregador ? `Solicitei entrega com ${checkoutData.entregador.nome}.` : "Farei a retirada local."} Aguardo confirmacao.`;
      
      try {
        await fetch(`${API_URL}/chat/enviar`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ destinatarioId: vendedorId, conteudo: mensagemVendedor }),
        });
        console.log("Mensagem enviada ao vendedor");
      } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
      }

      // 4) Se houver entrega, notificar o entregador e criar entrega no sistema
      if (checkoutData?.entregador) {
        try {
          // Criar registro de entrega
          await fetch(`${API_URL}/entregas/solicitar`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              clienteId: usuario._id || usuario.id,
              entregadorId: checkoutData.entregador.id,
              origem: "Ponto de retirada",
              destino: "Endereco do cliente",
              status: "pendente",
              valorFrete: checkoutData.entregador.tarifa
            }),
          });
          
          // Notificar entregador
          const msgEntregador = `Nova entrega solicitada! Cliente: ${usuario.nome}. Produto: ${carrinho[0]?.nome}. Valor: ${totalPedido.toLocaleString()} Kz.`;
          await fetch(`${API_URL}/chat/enviar`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ destinatarioId: checkoutData.entregador.id, conteudo: msgEntregador }),
          });
          console.log("Entregador notificado");
        } catch (err) {
          console.error("Erro ao notificar entregador:", err);
        }
      }

      setMensagemAutomatica(mensagemVendedor);
      setVendedorPrincipal({ _id: vendedorId, nome: vendedorNome });
      setCheckoutConfirmado(true);

      if (typeof onSucesso === "function") {
        onSucesso({ pedido: dataCarrinho.pedido || dataCarrinho, venda: dataVenda || null });
      }

      alert("Pedido confirmado com sucesso!");
      
      // Limpar carrinho no localStorage
      localStorage.removeItem("carrinho");
      
      // Navegar para historico de compras
      if (navigateToChat) {
        navigateToChat(usuario.nome, vendedorNome, mensagemVendedor);
      }

      return { pedido: dataCarrinho.pedido || dataCarrinho, venda: dataVenda || null };

    } catch (err) {
      console.error("Erro no checkout:", err);
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
        <p className="ml-3 text-gray-600">Carregando autenticacao...</p>
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