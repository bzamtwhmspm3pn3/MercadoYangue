import { useState } from "react";
import ConfirmacaoPagamentoProtegido from "./ConfirmacaoPagamentoProtegido";
import { FaTrashAlt, FaExclamationTriangle, FaMoneyBillWave } from "react-icons/fa";

const formatarKz = (valor) =>
  new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);

function AbaCarrinho({ carrinho, setCarrinho, usuario, enviarMensagemChat, navigateToChat }) {
  const [confirmarPagamento, setConfirmarPagamento] = useState(false);

  if (!usuario || usuario.tipo !== 'cliente') {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md text-gray-700">
        <p className="text-center text-lg">⚠️ Faça login como <strong>cliente</strong> para aceder ao carrinho.</p>
      </div>
    );
  }

  const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  const removerDoCarrinho = (id) => {
    setCarrinho(carrinho.filter((item) => item._id !== id));
  };

  const pagarPedido = () => {
    setConfirmarPagamento(true);
  };

  const onPagamentoConfirmado = () => {
    setCarrinho([]);
    setConfirmarPagamento(false);
  };

if (confirmarPagamento) {
  return (
    <ConfirmacaoPagamentoProtegido
      comprador={usuario}
      carrinho={carrinho}
      navigateToChat={navigateToChat}
      onConfirmar={onPagamentoConfirmado} // se precisar passar callback
    />
  );
}


  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl text-gray-800 mt-6">
      <h2 className="text-3xl font-extrabold text-green-700 mb-6 text-center">🛒 Carrinho de Compras</h2>

      {carrinho.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">O carrinho está vazio.</p>
      ) : (
        <>
          <ul className="space-y-6">
            {carrinho.map((item) => (
              <li key={item._id} className="p-4 rounded-lg border border-gray-200 shadow-sm bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-green-800">{item.nome} × {item.quantidade}</h3>
                  <span className="text-green-700 font-bold text-lg">{formatarKz(item.preco * item.quantidade)}</span>
                </div>

                <div className="text-sm text-gray-700 space-y-1 mb-3">
                  <p><strong>👤 Vendedor:</strong> {item.vendedor?.nome || item.nomeVendedor || 'Não informado'}</p>
                  <p><strong>📞 Contacto:</strong> {item.contactos || 'Não informado'}</p>
                  <div>
                    <p className="font-semibold mt-1">💳 Forma de Pagamento:</p>
                    {item.formaPagamento ? (
                      <ul className="ml-4 list-disc text-sm text-gray-600">
                        <li><strong>Tipo:</strong> {item.formaPagamento.tipo || 'Não informado'}</li>
                        {item.formaPagamento.iban && <li><strong>IBAN:</strong> {item.formaPagamento.iban}</li>}
                        {item.formaPagamento.numConta && <li><strong>Nº Conta:</strong> {item.formaPagamento.numConta}</li>}
                        {item.formaPagamento.banco && <li><strong>Banco:</strong> {item.formaPagamento.banco}</li>}
                        {item.formaPagamento.opcao && <li><strong>Opção:</strong> {item.formaPagamento.opcao}</li>}
                        {item.formaPagamento.telefone && <li><strong>Telefone:</strong> {item.formaPagamento.telefone}</li>}
                      </ul>
                    ) : (
                      <p className="text-gray-500">Não informado</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => removerDoCarrinho(item._id)}
                  className="flex items-center gap-2 text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  <FaTrashAlt /> Remover
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t pt-4">
            <p className="text-right text-xl font-bold text-green-800">Total Geral: {formatarKz(total)}</p>
          </div>

          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-4 flex items-start gap-3 rounded">
            <FaExclamationTriangle className="text-2xl mt-1" />
            <div>
              <p className="font-bold">Aviso importante:</p>
              <p className="text-sm">Efetue o pagamento <strong>somente após</strong> confirmar a existência e recepção do produto.</p>
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
  );
}

export default AbaCarrinho;
