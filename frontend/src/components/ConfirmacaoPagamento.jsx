import React, { useState, useEffect } from "react";
import { connectSocket } from "../socket";

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

  // Monta os dados do checkout
  const checkoutData = {
    vendedorId:
      vendedorPrincipal?._id ||
      carrinho[0]?.produto?.vendedor?._id ||
      carrinho[0]?.vendedorId ||
      null,
    produtos: carrinho.map(item => {
      const p = item?.produto || {}; // fallback vazio
      return {
        produto: p._id || item._id || null,
        nome: p.nome || item.nome || "Produto",
        quantidade: item.quantidade || 1,
        preco: p.preco ?? item.preco ?? 0
      };
    }),
    entregador: solicitaEntrega ? entregadorSelecionado : null,
    factura: solicitaFactura ? { tipo: "manual" } : null
  };

  // Dispara callback para gravar no backend
  if (typeof onConfirmar === "function") {
    onConfirmar(checkoutData);
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
