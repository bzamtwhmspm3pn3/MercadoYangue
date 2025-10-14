// src/components/AbaCarrinho.jsx
import React, { useEffect, useState } from "react";
import ConfirmacaoPagamentoProtegido from "./ConfirmacaoPagamentoProtegido";
import { FaTrashAlt, FaExclamationTriangle, FaMoneyBillWave } from "react-icons/fa";

const formatarKz = (valor) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);

function AbaCarrinho({ carrinho, setCarrinho, usuario, enviarMensagemChat, navigateToChat,setAbaAtiva }) {
  const [confirmarPagamento, setConfirmarPagamento] = useState(false);
  const [historicoCarrinhos, setHistoricoCarrinhos] = useState([]);

  // Funções para buscar dados — colocadas no escopo do componente para poderem ser chamadas por onSucesso
  const fetchCarrinho = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://mercadoyangue-i3in.onrender.com/api/carrinho/meu", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar carrinho");
      const dados = await res.json();
      setCarrinho(dados.itens || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistorico = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://mercadoyangue-i3in.onrender.com/api/carrinho/historico", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar histórico");
      const dados = await res.json();
      setHistoricoCarrinhos(dados || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Carregar inicialmente
  useEffect(() => {
    fetchCarrinho();
    fetchHistorico();
      }, []);

  if (!usuario || usuario.tipo !== "cliente") {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md text-gray-700">
        <p className="text-center text-lg">
          ⚠️ Faça login como <strong>cliente</strong> para aceder ao carrinho.
        </p>
      </div>
    );
  }

  const itensCarrinho = Array.isArray(carrinho) ? carrinho : [];
  const total = itensCarrinho.reduce(
    (acc, item) => acc + (item.produto?.preco || 0) * (item.quantidade || 1),
    0
  );

  const removerDoCarrinho = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://mercadoyangue-i3in.onrender.com/api/carrinho/remove/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao remover do carrinho");
      const dados = await res.json();
      // backend retorna carrinho atualizado; sincroniza estado
      setCarrinho(Array.isArray(dados.carrinho?.itens) ? dados.carrinho.itens : []);
      // Também atualizar histórico/stock localmente se precisar
      fetchHistorico();
    } catch (err) {
      alert("Não foi possível remover o produto.");
    }
  };

  const pagarPedido = () => setConfirmarPagamento(true);

  // função passada ao ConfirmacaoPagamentoProtegido: será chamada quando o checkout for concluído com sucesso
  const handleCheckoutSucesso = async (payload) => {
    // payload pode conter { pedido, venda } conforme definido no wrapper
    console.log("Checkout sucesso payload:", payload);
    // Recarregar carrinho e histórico do servidor
    await fetchCarrinho();        // deve vir vazio após checkout
    await fetchHistorico();       // mostra o novo pedido no histórico
    setConfirmarPagamento(false);
    alert("✅ Pagamento confirmado e histórico atualizado!");
  };

  if (confirmarPagamento) {
    return (
      <ConfirmacaoPagamentoProtegido
        carrinho={carrinho}
        navigateToChat={navigateToChat}
        tipoFactura="manual"
        onSucesso={handleCheckoutSucesso} // <-- Aqui: o wrapper chamará esta função quando tudo estiver OK
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-6 flex gap-6">
     {/* Histórico (esquerda) */}
<div className="w-1/3 bg-white p-6 rounded-2xl shadow-lg overflow-y-auto max-h-[80vh]">
  <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">
    🕘 Histórico de Carrinhos Pagos
  </h2>

  {historicoCarrinhos.length === 0 ? (
    <p className="text-center text-gray-600">
      Você ainda não finalizou compras.
    </p>
  ) : (
    historicoCarrinhos.map(c => (
      <div
        key={c._id}
        className="mb-6 p-4 border rounded-xl bg-gray-50 shadow-sm hover:shadow-md transition"
      >
        {/* Data do carrinho */}
        <p className="text-xs text-gray-500 mb-2">
          Finalizado em:{" "}
          <span className="font-medium">
            {new Date(c.criadoEm).toLocaleString()}
          </span>
        </p>

        {/* Lista de itens */}
        <ul className="divide-y divide-gray-200">
  {c.itens.map(i => (
    <li key={i._id} className="py-2">
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-800">
          {i.produto?.nome} × {i.quantidade}
        </span>
        <span className="font-semibold text-gray-700">
          {formatarKz(i.produto?.preco || 0)}
        </span>
      </div>

      <div className="text-xs text-gray-600 mt-1 space-y-1">
        <p>
          <strong>👤 Vendedor:</strong>{" "}
          {i.produto?.vendedor?.nome || "Não informado"}
        </p>
        <p>
          <strong>📞 Contacto:</strong>{" "}
          {i.produto?.vendedor?.contacto || i.produto?.contactos || "Não informado"}
        </p>
        {i.produto?.vendedor?.formaPagamento && (
          <>
            <p className="font-semibold mt-1">💳 Forma de Pagamento:</p>
            <ul className="ml-4 list-disc">
              <li>
                <strong>Tipo:</strong>{" "}
                {i.produto?.vendedor?.formaPagamento?.tipo || "Não informado"}
              </li>
              {i.produto?.vendedor?.formaPagamento?.iban && (
                <li>
                  <strong>IBAN:</strong> {i.produto?.vendedor?.formaPagamento?.iban}
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </li>
  ))}
</ul>


        {/* Total */}
        <p className="text-right font-bold text-green-700 mt-4 text-lg">
          Total:{" "}
          {formatarKz(
            c.itens.reduce(
              (acc, i) => acc + (i.produto?.preco || 0) * i.quantidade,
              0
            )
          )}
        </p>
      </div>
    ))
  )}
</div>

     {/* Carrinho ativo (direita) */}
<div className="w-2/3 bg-white p-8 rounded-2xl shadow-xl text-gray-800">

   {/* 🔹 Botão Voltar à Praça */}
<div className="mb-4">
  <button
    onClick={() => setAbaAtiva("produtos")} // volta para a praça
    className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-2xl shadow-md transition flex items-center gap-2"
  >
    🌾 Voltar à Praça
  </button>
</div>


        <h2 className="text-3xl font-extrabold text-green-700 mb-6 text-center">🛒 Carrinho de Compras</h2>
        {carrinho.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">O carrinho está vazio.</p>
        ) : (
          <>
            <ul className="space-y-6">
              {carrinho.map((item) => {
                const itemId = item._id ?? item.produto?._id ?? null;
                if (!itemId) return null;

                return (
                  <li key={itemId} className="p-4 rounded-lg border border-gray-200 shadow-sm bg-gray-50 hover:bg-gray-100 transition">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-green-800">{item.produto?.nome || item.nome} × {item.quantidade}</h3>
                      <span className="text-green-700 font-bold text-lg">{formatarKz(item.produto?.preco || 0)}</span>
                    </div>

                    <div className="text-sm text-gray-700 space-y-1 mb-3">
                      <p><strong>👤 Vendedor:</strong> {item.produto?.vendedor?.nome || "Não informado"}</p>
                      <p><strong>📞 Contacto:</strong> {item.produto?.vendedor?.contacto || item.produto?.contactos || "Não informado"}</p>
                      <p className="font-semibold mt-1">💳 Forma de Pagamento:</p>
                      {item.produto?.formaPagamento || item.formaPagamento ? (
                        <ul className="ml-4 list-disc text-sm text-gray-600">
                          <li><strong>Tipo:</strong> {item.produto?.formaPagamento?.tipo || item.formaPagamento?.tipo || "Não informado"}</li>
                          {item.produto?.formaPagamento?.iban && <li><strong>IBAN:</strong> {item.produto?.formaPagamento?.iban}</li>}
                          {item.produto?.formaPagamento?.numConta && <li><strong>Nº Conta:</strong> {item.produto?.formaPagamento?.numConta}</li>}
                          {item.produto?.formaPagamento?.banco && <li><strong>Banco:</strong> {item.produto?.formaPagamento?.banco}</li>}
                          {item.produto?.formaPagamento?.opcao && <li><strong>Opção:</strong> {item.produto?.formaPagamento?.opcao}</li>}
                          {item.produto?.formaPagamento?.telefone && <li><strong>Telefone:</strong> {item.produto?.formaPagamento?.telefone}</li>}
                        </ul>
                      ) : (
                        <p className="text-gray-500">Não informado</p>
                      )}
                    </div>

                    <button
                      onClick={() => removerDoCarrinho(itemId)}
                      disabled={!itemId}
                      className="flex items-center gap-2 text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      <FaTrashAlt /> Remover
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 border-t pt-4">
              <p className="text-right text-xl font-bold text-green-800">Total Geral: {formatarKz(total)}</p>
            </div>

            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-4 flex items-start gap-3 rounded">
              <FaExclamationTriangle className="text-2xl mt-1" />
              <div>
                <p className="font-bold">Aviso importante:</p>
                <p className="text-sm">
                  Efetue o pagamento <strong>somente após</strong> confirmar a existência e recepção do produto.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={pagarPedido}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition shadow"
              >
                <FaMoneyBillWave className="text-xl" /> Pagar Pedido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AbaCarrinho;
