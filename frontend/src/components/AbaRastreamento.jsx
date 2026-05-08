import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Corrigir ícone do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Ícone para veículo em movimento
const vehicleIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3096/3096973.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Ícone para origem
const originIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -15]
});

// Ícone para destino
const destinationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252025.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -15]
});

function AbaRastreamento({ usuario }) {
  const [entregasAtivas, setEntregasAtivas] = useState([]);
  const [entregaSelecionada, setEntregaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localizacaoAtual, setLocalizacaoAtual] = useState(null);
  const [rota, setRota] = useState([]);
  const [distancia, setDistancia] = useState(null);
  const [tempoEstimado, setTempoEstimado] = useState(null);
  const [instrucoes, setInstrucoes] = useState([]);
  const [instrucaoAtual, setInstrucaoAtual] = useState(null);
  const [simulandoMovimento, setSimulandoMovimento] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [map, setMap] = useState(null);
  const [destinoCoords, setDestinoCoords] = useState(null);
  const [origemCoords, setOrigemCoords] = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [atualizando, setAtualizando] = useState(false);

  // Obter ID do usuário
  const getUserId = () => usuario?.id || usuario?._id;

  // Carregar entregas do usuário
  useEffect(() => {
    carregarMinhasEntregas();
    obterLocalizacao();
    
    // Atualizar localização a cada 10 segundos
    const interval = setInterval(() => {
      if (localizacaoAtual) {
        atualizarLocalizacaoBackend();
      }
    }, 10000);
    
    return () => {
      if (intervalId) clearInterval(intervalId);
      clearInterval(interval);
    };
  }, [usuario?.id]);

  const obterLocalizacao = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocalizacaoAtual({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setLocalizacaoAtual({ lat: -8.839988, lng: 13.289437 }); // Luanda
        }
      );
    }
  };

  const atualizarLocalizacaoBackend = async () => {
    if (!localizacaoAtual || !entregaSelecionada || usuario?.tipo !== 'entregador') return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/entregadores/${getUserId()}/localizacao`, localizacaoAtual, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
    }
  };

  const carregarMinhasEntregas = async () => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let url;
      
      if (usuario.tipo === 'entregador') {
        url = `${API_URL}/entregas/entregador/${userId}`;
      } else if (usuario.tipo === 'vendedor') {
        url = `${API_URL}/entregas/vendedor/${userId}`;
      } else {
        url = `${API_URL}/entregas/cliente/${userId}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const entregas = response.data.data || [];
      
      // Filtrar entregas em andamento
      const entregasEmAndamento = entregas.filter(e => 
        e.status !== 'entregue' && e.status !== 'cancelada'
      );
      
      setEntregasAtivas(entregasEmAndamento);
      
      if (entregasEmAndamento.length > 0 && !entregaSelecionada) {
        setEntregaSelecionada(entregasEmAndamento[0]);
        calcularRotaParaEntrega(entregasEmAndamento[0]);
      }
      
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      setEntregasAtivas([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularRotaParaEntrega = async (entrega) => {
    if (!localizacaoAtual) return;
    
    // Simular coordenadas (em produção, viriam do backend)
    const destinos = {
      'Luanda': { lat: -8.839988, lng: 13.289437 },
      'Benguela': { lat: -12.578333, lng: 13.407222 },
      'Huambo': { lat: -12.776111, lng: 15.739167 },
      'Bié': { lat: -12.383333, lng: 16.933333 }
    };
    
    const destino = destinos[entrega.destino?.split(',')[0]] || destinos['Luanda'];
    setDestinoCoords(destino);
    setOrigemCoords(localizacaoAtual);
    await calcularRota(localizacaoAtual, destino);
  };

  const calcularRota = async (origem, destino) => {
    if (!origem || !destino) return;
    
    setAtualizando(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origem.lng},${origem.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        setRota(geometry);
        setDistancia((route.distance / 1000).toFixed(2));
        setTempoEstimado(Math.ceil(route.duration / 60));
        
        const instrucoesNavegacao = [];
        route.legs[0].steps.forEach((step, idx) => {
          instrucoesNavegacao.push({
            id: idx,
            instrucao: step.maneuver.instruction,
            distancia: (step.distance / 1000).toFixed(2),
            tempo: Math.ceil(step.duration / 60)
          });
        });
        setInstrucoes(instrucoesNavegacao);
        if (instrucoesNavegacao.length > 0) {
          setInstrucaoAtual(instrucoesNavegacao[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
    } finally {
      setAtualizando(false);
    }
  };

  const iniciarSimulacaoMovimento = () => {
    if (!rota.length || simulandoMovimento) return;
    
    setSimulandoMovimento(true);
    let index = 0;
    const intervalo = setInterval(() => {
      if (index < rota.length) {
        setLocalizacaoAtual({
          lat: rota[index][0],
          lng: rota[index][1]
        });
        if (instrucoes[index]) setInstrucaoAtual(instrucoes[index]);
        index++;
      } else {
        clearInterval(intervalo);
        setSimulandoMovimento(false);
        alert('Entrega concluída com sucesso!');
        carregarMinhasEntregas();
      }
    }, 2000);
    setIntervalId(intervalo);
  };

  const atualizarStatusEntrega = async (novoStatus) => {
    if (!entregaSelecionada?._id) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/entregas/${entregaSelecionada._id}/status`, {
        status: novoStatus,
        localizacao: localizacaoAtual
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Status atualizado para: ${novoStatus}`);
      carregarMinhasEntregas();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'pendente': { cor: 'bg-yellow-100 text-yellow-800', texto: '⏳ Pendente' },
      'aceita': { cor: 'bg-blue-100 text-blue-800', texto: '✅ Aceita' },
      'retirada': { cor: 'bg-purple-100 text-purple-800', texto: '📦 Produto Retirado' },
      'transporte': { cor: 'bg-orange-100 text-orange-800', texto: '🚚 Em Transporte' },
      'entregue': { cor: 'bg-green-100 text-green-800', texto: '🎉 Entregue' }
    };
    return config[status] || { cor: 'bg-gray-100', texto: status };
  };

  // Se não há entregas ativas
  if (!loading && entregasAtivas.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhuma entrega em andamento</h3>
        <p className="text-gray-600">
          {usuario?.tipo === 'cliente' 
            ? 'Você ainda não possui entregas ativas. Quando um vendedor confirmar sua entrega, ela aparecerá aqui.'
            : usuario?.tipo === 'vendedor'
            ? 'Você ainda não possui entregas para acompanhar. Quando um comprador finalizar a compra, a entrega aparecerá aqui.'
            : 'Você ainda não possui entregas designadas. Aceite uma solicitação de entrega para começar.'}
        </p>
      </div>
    );
  }

  if (!entregaSelecionada && entregasAtivas.length > 0) {
    setEntregaSelecionada(entregasAtivas[0]);
  }

  const statusBadge = getStatusBadge(entregaSelecionada?.status);
  const isEntregador = usuario?.tipo === 'entregador';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Rastreamento em Tempo Real</h2>
            <p className="opacity-90">Acompanhe sua entrega ao vivo</p>
          </div>
          <div className={`px-4 py-2 rounded-full ${statusBadge.cor} text-sm font-semibold`}>
            Status: {statusBadge.texto}
          </div>
        </div>
      </div>

      {/* Seleção de Entrega */}
      {entregasAtivas.length > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Selecione uma entrega</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {entregasAtivas.map(entrega => (
              <button
                key={entrega._id}
                onClick={() => {
                  setEntregaSelecionada(entrega);
                  calcularRotaParaEntrega(entrega);
                }}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                  entregaSelecionada?._id === entrega._id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Entrega #{entrega._id.slice(-6)} - {entrega.status}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detalhes da Entrega */}
      {entregaSelecionada && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Entregador */}
          {entregaSelecionada.entregadorId && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2">🚚 Entregador</h4>
              <p className="text-sm"><strong>Nome:</strong> {entregaSelecionada.entregadorId.nome}</p>
              <p className="text-sm"><strong>Telefone:</strong> {entregaSelecionada.entregadorId.telefone || 'Não informado'}</p>
              <p className="text-sm"><strong>Veículo:</strong> {entregaSelecionada.entregadorId.veiculo || 'Não informado'}</p>
              <button
                onClick={() => window.open(`https://wa.me/${entregaSelecionada.entregadorId.telefone?.replace(/\D/g, '')}`)}
                className="mt-2 w-full bg-blue-600 text-white py-1 rounded-lg text-sm"
              >
                📱 Contactar
              </button>
            </div>
          )}

          {/* Cliente/Comprador */}
          {entregaSelecionada.clienteId && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-bold text-green-800 mb-2">👤 Comprador</h4>
              <p className="text-sm"><strong>Nome:</strong> {entregaSelecionada.clienteId.nome}</p>
              <p className="text-sm"><strong>Telefone:</strong> {entregaSelecionada.clienteId.telefone || 'Não informado'}</p>
              <p className="text-sm"><strong>Destino:</strong> {entregaSelecionada.destino}</p>
              <button
                onClick={() => window.open(`https://wa.me/${entregaSelecionada.clienteId.telefone?.replace(/\D/g, '')}`)}
                className="mt-2 w-full bg-green-600 text-white py-1 rounded-lg text-sm"
              >
                📱 Contactar
              </button>
            </div>
          )}

          {/* Vendedor */}
          {entregaSelecionada.produtoId?.vendedorId && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h4 className="font-bold text-yellow-800 mb-2">🌾 Vendedor</h4>
              <p className="text-sm"><strong>Nome:</strong> {entregaSelecionada.produtoId.vendedorId.nome}</p>
              <p className="text-sm"><strong>Origem:</strong> {entregaSelecionada.origem}</p>
              <p className="text-sm"><strong>Produto:</strong> {entregaSelecionada.produtoId.nome}</p>
              <button
                onClick={() => window.open(`https://wa.me/${entregaSelecionada.produtoId.vendedorId.telefone?.replace(/\D/g, '')}`)}
                className="mt-2 w-full bg-yellow-600 text-white py-1 rounded-lg text-sm"
              >
                📱 Contactar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mapa */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">
            🗺️ Rota de Entrega
            {distancia && (
              <span className="text-sm font-normal text-gray-500 ml-3">
                📍 {distancia} km | ⏱️ {tempoEstimado} min
              </span>
            )}
          </h3>
          {ultimaAtualizacao && (
            <span className="text-xs text-gray-400">
              Última atualização: {ultimaAtualizacao.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        {localizacaoAtual ? (
          <MapContainer
            center={[localizacaoAtual.lat, localizacaoAtual.lng]}
            zoom={13}
            className="h-[450px] w-full"
            whenCreated={setMap}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.3}
            />
            
            {/* Veículo em movimento */}
            <Marker position={[localizacaoAtual.lat, localizacaoAtual.lng]} icon={vehicleIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold">🚚 Veículo em movimento</p>
                  <p className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</p>
                </div>
              </Popup>
            </Marker>
            
            {/* Origem */}
            {origemCoords && (
              <Marker position={[origemCoords.lat, origemCoords.lng]} icon={originIcon}>
                <Popup>📍 Ponto de partida</Popup>
              </Marker>
            )}
            
            {/* Destino */}
            {destinoCoords && (
              <Marker position={[destinoCoords.lat, destinoCoords.lng]} icon={destinationIcon}>
                <Popup>🎯 Destino final</Popup>
              </Marker>
            )}
            
            {/* Rota */}
            {rota.length > 0 && (
              <Polyline positions={rota} color="#2563EB" weight={4} opacity={0.8} />
            )}
          </MapContainer>
        ) : (
          <div className="bg-yellow-50 p-8 text-center">
            <p>🌐 Ative sua localização para ver o mapa</p>
            <button onClick={obterLocalizacao} className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded-lg">
              Ativar Localização
            </button>
          </div>
        )}
      </div>

      {/* Instrução Atual */}
      {instrucaoAtual && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🗺️</div>
            <div className="flex-1">
              <p className="font-bold text-blue-800">Próxima instrução</p>
              <p className="text-gray-700 mt-1">{instrucaoAtual.instrucao}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>📏 {instrucaoAtual.distancia} km</span>
                <span>⏱️ {instrucaoAtual.tempo} min</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Instruções */}
      {instrucoes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h4 className="font-bold text-gray-800 mb-2">📋 Instruções de Navegação</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {instrucoes.map((inst, idx) => (
              <div key={idx} className={`p-2 rounded-lg text-sm ${instrucaoAtual?.id === idx ? 'bg-blue-100' : 'bg-gray-50'}`}>
                <p className="text-gray-700">{inst.instrucao}</p>
                <p className="text-xs text-gray-400">📏 {inst.distancia} km | ⏱️ {inst.tempo} min</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações do Entregador */}
      {isEntregador && entregaSelecionada && (
        <div className="bg-gray-50 rounded-xl p-4 border">
          <h4 className="font-bold mb-2">🎮 Ações da Entrega</h4>
          <div className="flex gap-2 flex-wrap">
            {entregaSelecionada.status === 'pendente' && (
              <button onClick={() => atualizarStatusEntrega('aceita')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                Aceitar Entrega
              </button>
            )}
            {entregaSelecionada.status === 'aceita' && (
              <button onClick={() => atualizarStatusEntrega('retirada')} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                Produto Retirado
              </button>
            )}
            {entregaSelecionada.status === 'retirada' && (
              <>
                <button
                  onClick={() => {
                    atualizarStatusEntrega('transporte');
                    calcularRotaParaEntrega(entregaSelecionada);
                  }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Iniciar Transporte
                </button>
                {rota.length > 0 && !simulandoMovimento && (
                  <button onClick={iniciarSimulacaoMovimento} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
                    🚗 Iniciar Navegação
                  </button>
                )}
              </>
            )}
            {entregaSelecionada.status === 'transporte' && (
              <button onClick={() => atualizarStatusEntrega('entregue')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
                Confirmar Entrega
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}

export default AbaRastreamento;