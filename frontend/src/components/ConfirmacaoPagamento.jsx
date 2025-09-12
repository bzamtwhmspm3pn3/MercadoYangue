import React, { useState, useEffect } from "react";

export default function ConfirmacaoPagamento({
  comprador,
  carrinho,
  navigateToChat,
  onConfirmar,
  vendedorPrincipal,
  checkoutConfirmado,
  loading
}) {
  const [solicitaFactura, setSolicitaFactura] = useState(false);
  const [solicitaEntrega, setSolicitaEntrega] = useState(false);
  const [entregadores, setEntregadores] = useState([]);
  const [entregadorSelecionado, setEntregadorSelecionado] = useState(null);
  const [filtros, setFiltros] = useState({ provincia: "", municipio: "", veiculo: "" });
  const [mensagemAutomatica, setMensagemAutomatica] = useState("");

  useEffect(() => {
    setEntregadores([
      { nome: "Manuel Moto", veiculo: "Moto", provincia: "Luanda", municipio: "Viana", local: "KM 30", pagamento: "TPA", tarifa: 1500, contacto: "923-000-111" },
      { nome: "Joana Carro", veiculo: "Carro", provincia: "Luanda", municipio: "Kilamba Kiaxi", local: "KK 5000", pagamento: "Dinheiro", tarifa: 2500, contacto: "922-123-456" },
      { nome: "Carlos Van", veiculo: "Kombi", provincia: "Huíla", municipio: "Lubango", local: "Tchioco", pagamento: "Transferência", tarifa: 3000, contacto: "924-888-777" },
      { nome: "Pedro Bike", veiculo: "Bicicleta", provincia: "Benguela", municipio: "Lobito", local: "Restinga", pagamento: "TPA", tarifa: 1000, contacto: "926-789-101" },
    ]);
  }, []);

  const confirmarPagamentoLocal = () => {
    if (!carrinho || carrinho.length === 0) return alert("Carrinho vazio!");
    if (solicitaEntrega && !entregadorSelecionado) return alert("Selecione um entregador");

    // Checkout correto
    const checkoutData = {
      vendedorId: vendedorPrincipal?._id || carrinho[0]?.vendedorId,
      produtos: carrinho.map(item => ({
        produto: item._id || item.produtoId, // ID real pro banco
        nome: item.nome || item.produto,    // Nome legível pra mensagem
        quantidade: item.quantidade,
        preco: item.preco
      })),
      entregador: solicitaEntrega ? entregadorSelecionado : null,
      factura: solicitaFactura ? { tipo: "manual" } : null
    };

    // Mensagem para o vendedor
    let msg = `🎉 Pagamento confirmado e mensagem enviada ao vendedor!\n\n`;
    msg += `👋 Olá ${vendedorPrincipal?.nome || "vendedor"}, acabei de comprar alguns dos seus produtos:\n\n`;

    checkoutData.produtos.forEach(item => {
      const totalItem = item.preco * item.quantidade;
      msg += `• ${item.nome} — ${item.quantidade} x ${item.preco.toLocaleString()} Kz = ${totalItem.toLocaleString()} Kz\n`;
    });

    if (solicitaFactura) msg += `\n📄 Gostaria de receber uma factura.`;

    if (solicitaEntrega && entregadorSelecionado) {
      const e = entregadorSelecionado;
      msg += `\n\n🚚 Solicitei entrega com os seguintes dados:\n• Nome: ${e.nome}\n• Veículo: ${e.veiculo}\n• Local: ${e.local}, ${e.municipio}, ${e.provincia}\n• Tarifa: ${e.tarifa.toLocaleString()} Kz\n• Pagamento: ${e.pagamento}\n• Contacto: ${e.contacto}`;
    }

    msg += `\n\n🙏 Obrigado pela sua atenção. Fico a aguardar!`;

    setMensagemAutomatica(msg);

    if (typeof onConfirmar === "function") {
      onConfirmar(checkoutData, msg, vendedorPrincipal);
    }
  };

  // Filtros
  const provincias = [...new Set(entregadores.map(e => e.provincia))];
  const municipios = [...new Set(entregadores.filter(e => !filtros.provincia || e.provincia === filtros.provincia).map(e => e.municipio))];
  const veiculos = [...new Set(entregadores.map(e => e.veiculo))];

  const entregadoresFiltrados = entregadores.filter(e =>
    (!filtros.provincia || e.provincia === filtros.provincia) &&
    (!filtros.municipio || e.municipio === filtros.municipio) &&
    (!filtros.veiculo || e.veiculo === filtros.veiculo)
  );

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Confirmação de Pagamento</h2>

      {/* Opções */}
      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={solicitaFactura} onChange={e => setSolicitaFactura(e.target.checked)} />
          <span>Desejo factura</span>
        </label>
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={solicitaEntrega} onChange={e => setSolicitaEntrega(e.target.checked)} />
          <span>Desejo entrega</span>
        </label>
      </div>

      {solicitaEntrega && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Escolher Entregador</h4>
          <FiltrosEntregadores provincias={provincias} municipios={municipios} veiculos={veiculos} filtros={filtros} setFiltros={setFiltros} />
          <ListaEntregadores entregadores={entregadoresFiltrados} selecionado={entregadorSelecionado} onSelecionar={setEntregadorSelecionado} />
        </div>
      )}

      <button
        onClick={confirmarPagamentoLocal}
        disabled={(solicitaEntrega && !entregadorSelecionado) || loading}
        className={`w-full py-3 font-bold text-white rounded ${solicitaEntrega && !entregadorSelecionado || loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {loading ? "A processar..." : "Confirmar Pagamento"}
      </button>

{/* Caixa com mensagem pronta */}
{mensagemAutomatica && (
  <div className="mt-6 bg-green-50 border border-green-400 rounded p-4">
    <h3 className="text-lg font-bold text-green-800 mb-2">
      🎉 Pagamento confirmado!
    </h3>
    <p className="text-green-700">
      A sua mensagem foi automaticamente enviada ao vendedor.  
      Pode acompanhar a resposta na área de mensagens.
    </p>
  </div>
)}

    </div>
  );
}

// --- Componentes auxiliares ---
function FiltrosEntregadores({ provincias, municipios, veiculos, filtros, setFiltros }) {
  return (
    <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-3">
      <select className="border p-2 rounded" value={filtros.provincia} onChange={e => setFiltros(prev => ({ ...prev, provincia: e.target.value, municipio: "" }))}>
        <option value="">Todas Províncias</option>
        {provincias.map(p => <option key={p}>{p}</option>)}
      </select>
      <select className="border p-2 rounded" value={filtros.municipio} onChange={e => setFiltros(prev => ({ ...prev, municipio: e.target.value }))} disabled={!filtros.provincia}>
        <option value="">Todos Municípios</option>
        {municipios.map(m => <option key={m}>{m}</option>)}
      </select>
      <select className="border p-2 rounded" value={filtros.veiculo} onChange={e => setFiltros(prev => ({ ...prev, veiculo: e.target.value }))}>
        <option value="">Todos Veículos</option>
        {veiculos.map(v => <option key={v}>{v}</option>)}
      </select>
    </div>
  );
}

function ListaEntregadores({ entregadores, selecionado, onSelecionar }) {
  if (entregadores.length === 0) return <p className="text-sm italic text-gray-500">Nenhum entregador disponível.</p>;

  return (
    <ul className="space-y-3 max-h-64 overflow-y-auto border rounded p-3 bg-gray-50">
      {entregadores.map((e, i) => (
        <li
          key={i}
          tabIndex={0}
          onClick={() => onSelecionar(e)}
          onKeyDown={ev => ev.key === "Enter" && onSelecionar(e)}
          className={`cursor-pointer p-3 rounded border ${selecionado?.nome === e.nome ? "bg-green-100 border-green-500" : "bg-white border-gray-300"}`}
        >
          <p><strong>{e.nome}</strong> — {e.veiculo}</p>
          <p>{e.local}, {e.municipio}, {e.provincia}</p>
          <p>💰 {e.tarifa.toLocaleString()} Kz | 📞 {e.contacto}</p>
        </li>
      ))}
    </ul>
  );
}
