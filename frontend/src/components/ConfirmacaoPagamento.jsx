import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ConfirmacaoPagamento({
  comprador,
  carrinho,
  navigateToChat,
  onConfirmar,
  vendedorPrincipal,
  checkoutConfirmado,
  loading: loadingProp
}) {
  const [solicitaFactura, setSolicitaFactura] = useState(false);
  const [solicitaEntrega, setSolicitaEntrega] = useState(false);
  const [entregadores, setEntregadores] = useState([]);
  const [entregadorSelecionado, setEntregadorSelecionado] = useState(null);
  const [filtros, setFiltros] = useState({ provincia: "", municipio: "", veiculo: "" });
  const [loading, setLoading] = useState(false);
  const [carregandoEntregadores, setCarregandoEntregadores] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Buscar entregadores reais do backend quando solicitar entrega
  useEffect(() => {
    if (solicitaEntrega) {
      buscarEntregadoresReais();
    }
  }, [solicitaEntrega]);

  const buscarEntregadoresReais = async () => {
    setCarregandoEntregadores(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/entregadores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.data.length > 0) {
        const entregadoresReais = response.data.data.map(ent => ({
          _id: ent._id,
          nome: ent.nome,
          veiculo: ent.veiculo || "Nao informado",
          provincia: ent.provincia || "Nao informada",
          municipio: ent.municipio || "Nao informado",
          local: ent.localizacaoEspecifica || ent.municipio || "Ponto de encontro",
          tarifa: ent.tarifa || 1500,
          telefone: ent.telefone || "Nao informado",
          email: ent.email,
          disponivel: ent.disponivel !== false
        }));
        setEntregadores(entregadoresReais);
      } else {
        setEntregadores([]);
      }
    } catch (error) {
      console.error("Erro ao buscar entregadores:", error);
      setEntregadores([]);
    } finally {
      setCarregandoEntregadores(false);
    }
  };

  const confirmarPagamento = () => {
    if (!carrinho || carrinho.length === 0) {
      alert("Carrinho vazio!");
      return;
    }
    if (solicitaEntrega && !entregadorSelecionado) {
      alert("Selecione um entregador");
      return;
    }

    // Montar os dados do checkout
    const checkoutData = {
      vendedorId: vendedorPrincipal?._id ||
        carrinho[0]?.vendedor?._id ||
        carrinho[0]?.vendedorId ||
        null,
      produtos: carrinho.map(item => ({
        produto: item._id || item.produtoId || null,
        nome: item.nome || "Produto",
        quantidade: item.quantidade || 1,
        preco: item.preco || 0,
        subtotal: (item.preco || 0) * (item.quantidade || 1)
      })),
      entregador: solicitaEntrega ? {
        id: entregadorSelecionado._id,
        nome: entregadorSelecionado.nome,
        telefone: entregadorSelecionado.telefone,
        tarifa: entregadorSelecionado.tarifa
      } : null,
      factura: solicitaFactura ? { tipo: "manual" } : null,
      metodoPagamento: "transferencia",
      referencia: `REF-${Date.now()}`
    };

    // Dispara callback para gravar no backend
    if (typeof onConfirmar === "function") {
      onConfirmar(checkoutData);
    }
  };

  const provincias = [...new Set(entregadores.map(e => e.provincia).filter(Boolean))];
  const municipios = [...new Set(
    entregadores
      .filter(e => !filtros.provincia || e.provincia === filtros.provincia)
      .map(e => e.municipio)
      .filter(Boolean)
  )];
  const veiculos = [...new Set(entregadores.map(e => e.veiculo).filter(Boolean))];

  const entregadoresFiltrados = entregadores.filter(e =>
    (!filtros.provincia || e.provincia === filtros.provincia) &&
    (!filtros.municipio || e.municipio === filtros.municipio) &&
    (!filtros.veiculo || e.veiculo === filtros.veiculo) &&
    e.disponivel !== false
  );

  const totalCarrinho = carrinho.reduce((sum, item) => {
    const preco = item.preco || 0;
    const quantidade = item.quantidade || 1;
    return sum + (preco * quantidade);
  }, 0);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">Confirmacao de Pagamento</h2>
        <p className="text-green-100 text-sm">Revise os detalhes do seu pedido</p>
      </div>

      {/* Resumo do Pedido */}
      <div className="p-6 border-b">
        <h3 className="font-semibold text-gray-800 mb-3">Itens do Pedido</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {carrinho.map((item, idx) => {
            const nome = item.nome || "Produto";
            const preco = item.preco || 0;
            const quantidade = item.quantidade || 1;
            return (
              <div key={idx} className="flex justify-between text-sm py-1 border-b">
                <span>{quantidade}x {nome}</span>
                <span className="font-semibold">{(preco * quantidade).toLocaleString()} Kz</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between font-bold text-lg mt-3 pt-2 border-t">
          <span>Total</span>
          <span className="text-green-700">{totalCarrinho.toLocaleString()} Kz</span>
        </div>
      </div>

      {/* Opcoes */}
      <div className="p-6 border-b">
        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={solicitaFactura} onChange={e => setSolicitaFactura(e.target.checked)} className="w-5 h-5 text-green-600 rounded" />
            <span className="text-gray-700">Desejo factura (NIF obrigatorio)</span>
          </label>
        </div>
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={solicitaEntrega} onChange={e => setSolicitaEntrega(e.target.checked)} className="w-5 h-5 text-green-600 rounded" />
            <span className="text-gray-700">Desejo servico de entrega</span>
          </label>
        </div>
      </div>

      {/* Entregadores */}
      {solicitaEntrega && (
        <div className="p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Escolha seu entregador</h3>
            <button onClick={() => setMostrarFiltros(!mostrarFiltros)} className="text-sm text-green-600">
              {mostrarFiltros ? "Ocultar Filtros" : "Mostrar Filtros"}
            </button>
          </div>
          
          {carregandoEntregadores ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>
          ) : entregadores.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <p>Nenhum entregador cadastrado no momento.</p>
              <p className="text-sm text-gray-400">Tente novamente mais tarde ou opte por retirada local.</p>
            </div>
          ) : (
            <>
              {mostrarFiltros && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <select className="border rounded-lg p-2 text-sm" value={filtros.provincia} onChange={e => setFiltros(prev => ({ ...prev, provincia: e.target.value, municipio: "" }))}>
                    <option value="">Todas Provincias</option>
                    {provincias.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <select className="border rounded-lg p-2 text-sm" value={filtros.municipio} onChange={e => setFiltros(prev => ({ ...prev, municipio: e.target.value }))} disabled={!filtros.provincia}>
                    <option value="">Todos Municipios</option>
                    {municipios.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <select className="border rounded-lg p-2 text-sm" value={filtros.veiculo} onChange={e => setFiltros(prev => ({ ...prev, veiculo: e.target.value }))}>
                    <option value="">Todos Veiculos</option>
                    {veiculos.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              )}
              {entregadoresFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhum entregador disponivel.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {entregadoresFiltrados.map((entregador, idx) => (
                    <div key={entregador._id || idx} onClick={() => setEntregadorSelecionado(entregador)} className={`p-4 rounded-xl border-2 cursor-pointer ${entregadorSelecionado?.nome === entregador.nome ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
                      <div className="flex justify-between">
                        <div>
                          <div className="font-bold">{entregador.nome} <span className="text-xs bg-green-100 text-green-700 px-2 rounded-full">{entregador.veiculo}</span></div>
                          <div className="text-sm text-gray-500">{entregador.local}, {entregador.municipio}, {entregador.provincia}</div>
                          <div className="text-sm text-gray-500">Telefone: {entregador.telefone}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-700">{entregador.tarifa.toLocaleString()} Kz</div>
                          <div className="text-xs text-gray-400">taxa de entrega</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="p-6 bg-white border-t">
        <button onClick={confirmarPagamento} disabled={(solicitaEntrega && !entregadorSelecionado) || loading || loadingProp} className="w-full py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
          {loading || loadingProp ? "Processando..." : "Confirmar Pagamento"}
        </button>
        {solicitaEntrega && entregadorSelecionado && (
          <p className="text-xs text-center text-gray-500 mt-3">Entrega solicitada para {entregadorSelecionado.nome}</p>
        )}
      </div>
    </div>
  );
}