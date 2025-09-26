import React, { useState, useEffect } from "react";

export default function ConfirmacaoPagamento({ comprador, carrinho, navigateToChat }) {
  const [solicitaFactura, setSolicitaFactura] = useState(false);
  const [solicitaEntrega, setSolicitaEntrega] = useState(false);
  const [entregadores, setEntregadores] = useState([]);
  const [entregadorSelecionado, setEntregadorSelecionado] = useState(null);
  const [mensagemAoVendedor, setMensagemAoVendedor] = useState("");
  const [vendedorPrincipal, setVendedorPrincipal] = useState("");
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);
  const [filtros, setFiltros] = useState({ provincia: "", municipio: "", veiculo: "" });

  useEffect(() => {
    setEntregadores([
      { nome: "Manuel Moto", veiculo: "Moto", provincia: "Luanda", municipio: "Viana", local: "KM 30", pagamento: "TPA", tarifa: 1500, contacto: "923-000-111" },
      { nome: "Joana Carro", veiculo: "Carro", provincia: "Luanda", municipio: "Kilamba Kiaxi", local: "KK 5000", pagamento: "Dinheiro", tarifa: 2500, contacto: "922-123-456" },
      { nome: "Carlos Van", veiculo: "Kombi", provincia: "Huíla", municipio: "Lubango", local: "Tchioco", pagamento: "Transferência", tarifa: 3000, contacto: "924-888-777" },
      { nome: "Pedro Bike", veiculo: "Bicicleta", provincia: "Benguela", municipio: "Lobito", local: "Restinga", pagamento: "TPA", tarifa: 1000, contacto: "926-789-101" },
    ]);
  }, []);

  const provincias = [...new Set(entregadores.map(e => e.provincia))];
  const municipios = [...new Set(entregadores.filter(e => !filtros.provincia || e.provincia === filtros.provincia).map(e => e.municipio))];
  const veiculos = [...new Set(entregadores.map(e => e.veiculo))];

  const entregadoresFiltrados = entregadores.filter(e =>
    (!filtros.provincia || e.provincia === filtros.provincia) &&
    (!filtros.municipio || e.municipio === filtros.municipio) &&
    (!filtros.veiculo || e.veiculo === filtros.veiculo)
  );

  const gerarMensagemVendedor = ({ comprador, desejaFactura, desejaEntrega, entregador, itens }) => {
  let msg = `👋 Olá! Acabei de comprar alguns dos seus produtos:\n\n`;

  itens.forEach(item => {
    const totalItem = item.precoUnitario * item.quantidade;
    msg += `• ${item.nome} — ${item.quantidade} x ${item.precoUnitario.toLocaleString()} Kz = ${totalItem.toLocaleString()} Kz\n`;
  });

  if (desejaFactura) {
    msg += `\n📄 Gostaria de receber uma factura. Caso não possa emitir, por favor envie o seu BI para efeitos de autofacturação.`;
  }

  if (desejaEntrega && entregador) {
    msg += `\n\n🚚 Solicitei entrega com os seguintes dados:\n• Nome: ${entregador.nome}\n• Veículo: ${entregador.veiculo}\n• Local: ${entregador.local}, ${entregador.municipio}, ${entregador.provincia}\n• Tarifa: ${entregador.tarifa.toLocaleString()} Kz\n• Pagamento: ${entregador.pagamento}\n• Contacto: ${entregador.contacto}`;
  }

  msg += `\n\n🙏 Obrigado pela sua atenção. Fico a aguardar!`;
  return msg;
};


  const confirmarPagamento = async () => {
    const vendedoresUnicos = Array.from(new Set(carrinho.map(item => item.vendedor?._id || item.nomeVendedor || "Desconhecido")));

    for (const vendedorChave of vendedoresUnicos) {
      const itens = carrinho
        .filter(item => (item.vendedor?._id || item.nomeVendedor) === vendedorChave)
        .map(item => ({
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario ?? item.preco ?? 0,
          total: item.quantidade * (item.precoUnitario ?? item.preco ?? 0),
        }));

      const totalGeral = itens.reduce((acc, cur) => acc + cur.total, 0);

      const nomeVendedor = carrinho.find(item =>
        (item.vendedor?._id || item.nomeVendedor) === vendedorChave
      )?.vendedor?.nome || carrinho.find(item =>
        item.nomeVendedor === vendedorChave
      )?.nomeVendedor || "Vendedor";

      try {
        const token = localStorage.getItem("token");

        await fetch("https://mercadoyangue-i3in.onrender.com/api/vendas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            vendedorId: vendedorChave,
            produtos: itens,
            totalGeral,
            entregador: solicitaEntrega ? entregadorSelecionado : null,
            factura: solicitaFactura
  ? { tipo: "autofactura" } // ou "manual", dependendo do contexto
  : undefined,
          }),
        });

        const msgAutomatica = gerarMensagemVendedor({
          comprador,
          desejaFactura: solicitaFactura,
          desejaEntrega: solicitaEntrega,
          entregador: entregadorSelecionado,
          itens,
        });

        localStorage.setItem("mensagemPreChat", JSON.stringify({
          vendedor: nomeVendedor,
          mensagem: msgAutomatica,
          de: comprador?.nome || comprador?.email || "Cliente",
        }));

        navigateToChat(comprador, nomeVendedor, msgAutomatica);
        if (!vendedorPrincipal) setVendedorPrincipal(nomeVendedor);
      } catch (err) {
        console.error("Erro ao registrar venda:", err);
        alert("Erro ao registrar a venda. Tente novamente.");
      }
    }

    setPagamentoConfirmado(true);
  };

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Confirmação de Pagamento</h2>

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

      {pagamentoConfirmado ? (
        <div className="mt-8 bg-green-50 border border-green-400 rounded p-6">
          <h3 className="text-xl font-bold text-green-800 mb-3">🎉 Pagamento confirmado!</h3>
          <p className="mb-3">Pode agora enviar uma mensagem personalizada ao vendedor:</p>
          <textarea
            value={mensagemAoVendedor}
            onChange={e => setMensagemAoVendedor(e.target.value)}
            rows={5}
            className="w-full border rounded p-3 mb-4"
          />
          <button
            onClick={() => navigateToChat(comprador, vendedorPrincipal, mensagemAoVendedor)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Enviar mensagem e abrir chat
          </button>
        </div>
      ) : (
        <button
          onClick={confirmarPagamento}
          disabled={solicitaEntrega && !entregadorSelecionado}
          className={`w-full py-3 font-bold text-white rounded ${solicitaEntrega && !entregadorSelecionado ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          Confirmar Pagamento
        </button>
      )}
    </div>
  );
}

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
  if (entregadores.length === 0) {
    return <p className="text-sm italic text-gray-500">Nenhum entregador disponível.</p>;
  }

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
