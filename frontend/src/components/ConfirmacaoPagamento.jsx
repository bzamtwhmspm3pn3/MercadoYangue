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

  // Buscar entregadores reais do backend
  useEffect(() => {
    if (solicitaEntrega) {
      buscarEntregadores();
    }
  }, [solicitaEntrega]);

  const buscarEntregadores = async () => {
    setCarregandoEntregadores(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/entregadores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Mapear os dados do backend para o formato esperado
        const entregadoresReais = response.data.data.map(ent => ({
          _id: ent._id,
          nome: ent.nome,
          email: ent.email,
          telefone: ent.telefone || "Não informado",
          veiculo: ent.veiculo || "Não informado",
          placa: ent.placa || "Sem placa",
          provincia: ent.provincia || "Não informada",
          municipio: ent.municipio || "Não informado",
          local: ent.localizacaoEspecifica || ent.municipio || "Ponto de encontro",
          tarifa: ent.tarifa || calcularTarifaBase(ent.veiculo),
          disponivel: ent.disponivel !== false,
          localizacaoAtual: ent.localizacaoAtual
        }));
        setEntregadores(entregadoresReais);
      } else {
        console.error("Erro ao buscar entregadores:", response.data.message);
        setEntregadores([]);
      }
    } catch (error) {
      console.error("Erro na requisição de entregadores:", error);
      setEntregadores([]);
    } finally {
      setCarregandoEntregadores(false);
    }
  };

  // Calcular tarifa base baseada no tipo de veículo
  const calcularTarifaBase = (veiculo) => {
    const tarifas = {
      'moto': 1000,
      'bicicleta': 500,
      'carro': 2000,
      'kombi': 2500,
      'camiao': 4000
    };
    const veiculoLower = (veiculo || "").toLowerCase();
    return tarifas[veiculoLower] || 1500;
  };

  const confirmarPagamento = async () => {
    if (!carrinho || carrinho.length === 0) {
      alert("Carrinho vazio!");
      return;
    }
    if (solicitaEntrega && !entregadorSelecionado) {
      alert("Selecione um entregador");
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // Montar os dados do checkout
      const checkoutData = {
        compradorId: JSON.parse(localStorage.getItem("usuario"))?.id,
        produtos: carrinho.map(item => ({
          produtoId: item._id || item.produtoId,
          nome: item.nome,
          quantidade: item.quantidade,
          preco: item.preco,
          subtotal: item.preco * item.quantidade
        })),
        total: carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0),
        solicitaFactura,
        entrega: solicitaEntrega ? {
          entregadorId: entregadorSelecionado._id,
          entregadorNome: entregadorSelecionado.nome,
          tarifa: entregadorSelecionado.tarifa,
          endereco: entregadorSelecionado.local
        } : null,
        status: "pendente"
      };

      // Salvar o pedido no backend
      const response = await axios.post(`${API_URL}/pedidos`, checkoutData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`✅ Pedido confirmado! ${solicitaEntrega ? `Entregador: ${entregadorSelecionado.nome}` : "Retirada local"}`);
        
        // Enviar mensagem para o chat
        if (navigateToChat && vendedorPrincipal) {
          const mensagem = `Olá, acabei de confirmar meu pedido. ${solicitaEntrega ? `Solicitei entrega com ${entregadorSelecionado.nome}.` : "Farei a retirada local."} Aguardo confirmação.`;
          navigateToChat(comprador, vendedorPrincipal.nome, mensagem);
        }
        
        // Chamar callback se existir
        if (typeof onConfirmar === "function") {
          onConfirmar(checkoutData);
        }
      } else {
        alert("Erro ao confirmar pedido: " + (response.data.message || "Tente novamente"));
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      alert("Erro ao processar pagamento. Verifique sua conexão.");
    } finally {
      setLoading(false);
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
          {carrinho.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-1 border-b">
              <span>{item.quantidade}x {item.nome}</span>
              <span className="font-semibold">{(item.preco * item.quantidade).toLocaleString()} Kz</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-lg mt-3 pt-2 border-t">
          <span>Total</span>
          <span className="text-green-700">{carrinho.reduce((sum, i) => sum + (i.preco * i.quantidade), 0).toLocaleString()} Kz</span>
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
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-xl">🚚</span> Escolha seu entregador
          </h3>
          
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

              {/* Lista de Entregadores */}
              {entregadoresFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhum entregador disponível com os filtros selecionados.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {entregadoresFiltrados.map(entregador => (
                    <div
                      key={entregador._id}
                      onClick={() => setEntregadorSelecionado(entregador)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        entregadorSelecionado?._id === entregador._id
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
                            📍 {entregador.local || entregador.municipio}, {entregador.provincia}
                          </div>
                          <div className="text-sm text-gray-500">
                            📞 {entregador.telefone}
                          </div>
                          {entregador.placa && (
                            <div className="text-xs text-gray-400">
                              🚗 Placa: {entregador.placa}
                            </div>
                          )}
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
            Entrega solicitada para {entregadorSelecionado.nome}. Você pode acompanhar no chat.
          </p>
        )}
      </div>
    </div>
  );
}