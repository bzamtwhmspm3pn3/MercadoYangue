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
    } else {
      // Se não solicitar entrega, usar dados de exemplo (fallback)
      setEntregadores([
        { nome: "Manuel Moto", veiculo: "Moto", provincia: "Luanda", municipio: "Viana", local: "KM 30", tarifa: 1500, telefone: "923-000-111", disponivel: true },
        { nome: "Joana Carro", veiculo: "Carro", provincia: "Luanda", municipio: "Kilamba Kiaxi", local: "KK 5000", tarifa: 2500, telefone: "922-123-456", disponivel: true },
        { nome: "Carlos Van", veiculo: "Kombi", provincia: "Huíla", municipio: "Lubango", local: "Tchioco", tarifa: 3000, telefone: "924-888-777", disponivel: true },
        { nome: "Pedro Bike", veiculo: "Bicicleta", provincia: "Benguela", municipio: "Lobito", local: "Restinga", tarifa: 1000, telefone: "926-789-101", disponivel: true },
      ]);
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
          veiculo: ent.veiculo || "Não informado",
          provincia: ent.provincia || "Não informada",
          municipio: ent.municipio || "Não informado",
          local: ent.localizacaoEspecifica || ent.municipio || "Ponto de encontro",
          tarifa: ent.tarifa || 1500,
          telefone: ent.telefone || "Não informado",
          disponivel: ent.disponivel !== false
        }));
        setEntregadores(entregadoresReais);
      } else {
        // Fallback para dados de exemplo se não houver entregadores no backend
        setEntregadores([
          { nome: "Manuel Moto", veiculo: "Moto", provincia: "Luanda", municipio: "Viana", local: "KM 30", tarifa: 1500, telefone: "923-000-111", disponivel: true },
          { nome: "Joana Carro", veiculo: "Carro", provincia: "Luanda", municipio: "Kilamba Kiaxi", local: "KK 5000", tarifa: 2500, telefone: "922-123-456", disponivel: true },
        ]);
      }
    } catch (error) {
      console.error("Erro ao buscar entregadores:", error);
      // Fallback para dados locais
      setEntregadores([
        { nome: "Manuel Moto", veiculo: "Moto", provincia: "Luanda", municipio: "Viana", local: "KM 30", tarifa: 1500, telefone: "923-000-111", disponivel: true },
        { nome: "Joana Carro", veiculo: "Carro", provincia: "Luanda", municipio: "Kilamba Kiaxi", local: "KK 5000", tarifa: 2500, telefone: "922-123-456", disponivel: true },
      ]);
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

    // Montar os dados do checkout (mesmo formato da versão que funcionava)
    const checkoutData = {
      vendedorId: vendedorPrincipal?._id ||
        carrinho[0]?.produto?.vendedor?._id ||
        carrinho[0]?.vendedorId ||
        null,
      produtos: carrinho.map(item => {
        const p = item?.produto || {};
        return {
          produto: p._id || item._id || null,
          nome: p.nome || item.nome || "Produto",
          quantidade: item.quantidade || 1,
          preco: p.preco ?? item.preco ?? 0
        };
      }),
      entregador: solicitaEntrega ? entregadorSelecionado : null,
      factura: solicitaFactura ? { tipo: "manual" } : null,
      metodoPagamento: "transferencia",
      referencia: `REF-${Date.now()}`
    };

    // Dispara callback para gravar no backend
    if (typeof onConfirmar === "function") {
      onConfirmar(checkoutData);
    }
  };

  // Opções de filtro
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

  // Calcular total do carrinho corretamente
  const totalCarrinho = carrinho.reduce((sum, item) => {
    const preco = item.preco || item.produto?.preco || 0;
    const quantidade = item.quantidade || 1;
    return sum + (preco * quantidade);
  }, 0);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">✅ Confirmação de Pagamento</h2>
        <p className="text-green-100 text-sm">Revise os detalhes do seu pedido</p>
      </div>

      {/* Resumo do Pedido */}
      <div className="p-6 border-b">
        <h3 className="font-semibold text-gray-800 mb-3">🛒 Itens do Pedido</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {carrinho.map((item, idx) => {
            const nome = item.nome || item.produto?.nome || "Produto";
            const preco = item.preco || item.produto?.preco || 0;
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

      {/* Opções */}
      <div className="p-6 border-b">
        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={solicitaFactura} 
              onChange={e => setSolicitaFactura(e.target.checked)} 
              className="w-5 h-5 text-green-600 rounded"
            />
            <span className="text-gray-700">📄 Desejo factura (NIF obrigatório)</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={solicitaEntrega} 
              onChange={e => setSolicitaEntrega(e.target.checked)} 
              className="w-5 h-5 text-green-600 rounded"
            />
            <span className="text-gray-700">🚚 Desejo serviço de entrega</span>
          </label>
        </div>
      </div>

      {/* Seção de Entregadores */}
      {solicitaEntrega && (
        <div className="p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-xl">🚚</span> Escolha seu entregador
            </h3>
            <button 
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="text-sm text-green-600 hover:text-green-700"
            >
              {mostrarFiltros ? "Ocultar Filtros" : "Mostrar Filtros"}
            </button>
          </div>
          
          {carregandoEntregadores ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : entregadores.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <p className="text-gray-500">Nenhum entregador cadastrado no momento.</p>
              <p className="text-sm text-gray-400 mt-1">Tente novamente mais tarde ou opte por retirada local.</p>
            </div>
          ) : (
            <>
              {/* Filtros */}
              {mostrarFiltros && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <select 
                    className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500"
                    value={filtros.provincia} 
                    onChange={e => setFiltros(prev => ({ ...prev, provincia: e.target.value, municipio: "" }))}
                  >
                    <option value="">Todas Províncias</option>
                    {provincias.map(p => <option key={p}>{p}</option>)}
                  </select>
                  
                  <select 
                    className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500"
                    value={filtros.municipio} 
                    onChange={e => setFiltros(prev => ({ ...prev, municipio: e.target.value }))}
                    disabled={!filtros.provincia}
                  >
                    <option value="">Todos Municípios</option>
                    {municipios.map(m => <option key={m}>{m}</option>)}
                  </select>
                  
                  <select 
                    className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500"
                    value={filtros.veiculo} 
                    onChange={e => setFiltros(prev => ({ ...prev, veiculo: e.target.value }))}
                  >
                    <option value="">Todos Veículos</option>
                    {veiculos.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              )}

              {/* Lista de Entregadores */}
              {entregadoresFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhum entregador disponível com os filtros selecionados.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {entregadoresFiltrados.map((entregador, idx) => (
                    <div
                      key={entregador._id || idx}
                      onClick={() => setEntregadorSelecionado(entregador)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        entregadorSelecionado?.nome === entregador.nome
                          ? "border-green-500 bg-green-50 shadow-md"
                          : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-gray-800 flex items-center gap-2">
                            {entregador.nome}
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {entregador.veiculo}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            📍 {entregador.local}, {entregador.municipio}, {entregador.provincia}
                          </div>
                          <div className="text-sm text-gray-500">
                            📞 {entregador.telefone}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-700">
                            {entregador.tarifa.toLocaleString()} Kz
                          </div>
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

      {/* Botão de Confirmação */}
      <div className="p-6 bg-white border-t">
        <button
          onClick={confirmarPagamento}
          disabled={(solicitaEntrega && !entregadorSelecionado) || loading || loadingProp}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
            (solicitaEntrega && !entregadorSelecionado) || loading || loadingProp
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
          }`}
        >
          {loading || loadingProp ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processando...
            </span>
          ) : (
            "✅ Confirmar Pagamento"
          )}
        </button>
        
        {solicitaEntrega && entregadorSelecionado && (
          <p className="text-xs text-center text-gray-500 mt-3">
            🚚 Entrega solicitada para {entregadorSelecionado.nome}. Você pode acompanhar no chat.
          </p>
        )}
      </div>
    </div>
  );
}