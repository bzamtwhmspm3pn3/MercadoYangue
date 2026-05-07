import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Corrigir ícone do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Ícone personalizado para veículo em movimento
const vehicleIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3096/3096973.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AbaRastreamento({ usuario, produtoId, produto, entregaId }) {
  const [rastreamento, setRastreamento] = useState(null);
  const [entrega, setEntrega] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localizacaoAtual, setLocalizacaoAtual] = useState(null);
  const [rota, setRota] = useState([]);
  const [distancia, setDistancia] = useState(null);
  const [tempoEstimado, setTempoEstimado] = useState(null);
  const [instrucoes, setInstrucoes] = useState([]);
  const [instrucaoAtual, setInstrucaoAtual] = useState(null);
  const [entregadorInfo, setEntregadorInfo] = useState(null);
  const [compradorInfo, setCompradorInfo] = useState(null);
  const [vendedorInfo, setVendedorInfo] = useState(null);
  const [statusEntrega, setStatusEntrega] = useState(null);
  const [map, setMap] = useState(null);
  const [routingControl, setRoutingControl] = useState(null);
  const [simulandoMovimento, setSimulandoMovimento] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    carregarDados();
    obterLocalizacao();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (routingControl) routingControl.remove();
    };
  }, [produtoId, entregaId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar dados da entrega
      if (entregaId) {
        const entregaRes = await axios.get(`${API_URL}/entregas/${entregaId}`);
        if (entregaRes.data.success) {
          setEntrega(entregaRes.data.data);
          setStatusEntrega(entregaRes.data.data.status);
          
          // Carregar informações do entregador
          if (entregaRes.data.data.entregadorId) {
            setEntregadorInfo(entregaRes.data.data.entregadorId);
          }
          
          // Carregar informações do comprador
          if (entregaRes.data.data.clienteId) {
            setCompradorInfo(entregaRes.data.data.clienteId);
          }
          
          // Carregar informações do vendedor
          if (entregaRes.data.data.produtoId?.vendedorId) {
            const vendedorRes = await axios.get(`${API_URL}/usuarios/${entregaRes.data.data.produtoId.vendedorId}`);
            setVendedorInfo(vendedorRes.data.data);
          }
        }
      }
      
      // Carregar rastreamento do produto
      if (produtoId) {
        const rastreamentoRes = await axios.get(`${API_URL}/geolocalizacao/produto/${produtoId}`);
        if (rastreamentoRes.data.success && rastreamentoRes.data.data) {
          setRastreamento(rastreamentoRes.data.data);
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

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
          // Fallback para localização padrão (Luanda)
          setLocalizacaoAtual({ lat: -8.839988, lng: 13.289437 });
        }
      );
    }
  };

  const calcularRota = async (origem, destino) => {
    if (!origem || !destino) return;
    
    try {
      // Usar API do OpenStreetMap para calcular rota
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
        
        // Extrair instruções de navegação
        const instrucoesNavegacao = [];
        route.legs[0].steps.forEach((step, idx) => {
          instrucoesNavegacao.push({
            id: idx,
            instrucao: step.maneuver.instruction,
            distancia: (step.distance / 1000).toFixed(2),
            tempo: Math.ceil(step.duration / 60),
            posicao: [step.maneuver.location[1], step.maneuver.location[0]]
          });
        });
        setInstrucoes(instrucoesNavegacao);
        if (instrucoesNavegacao.length > 0) {
          setInstrucaoAtual(instrucoesNavegacao[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
    }
  };

  // Simular movimento do veículo (para demonstração)
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
        
        // Atualizar instrução atual
        if (instrucoes.length > 0 && instrucoes[index]) {
          setInstrucaoAtual(instrucoes[index]);
        }
        
        index++;
      } else {
        clearInterval(intervalo);
        setSimulandoMovimento(false);
        alert('✅ Entrega concluída com sucesso!');
      }
    }, 2000);
    
    setIntervalId(intervalo);
  };

  const atualizarStatusEntrega = async (novoStatus) => {
    if (!entrega?._id) return;
    
    try {
      const response = await axios.put(`${API_URL}/entregas/${entrega._id}/status`, {
        status: novoStatus,
        localizacao: localizacaoAtual
      });
      
      if (response.data.success) {
        setStatusEntrega(novoStatus);
        alert(`Status atualizado para: ${novoStatus}`);
        carregarDados();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pendente': { cor: 'bg-yellow-100 text-yellow-800', texto: '⏳ Pendente', icone: '⏳' },
      'aceita': { cor: 'bg-blue-100 text-blue-800', texto: '✅ Aceita', icone: '✅' },
      'retirada': { cor: 'bg-purple-100 text-purple-800', texto: '📦 Produto Retirado', icone: '📦' },
      'transporte': { cor: 'bg-orange-100 text-orange-800', texto: '🚚 Em Transporte', icone: '🚚' },
      'entregue': { cor: 'bg-green-100 text-green-800', texto: '🎉 Entregue', icone: '🎉' },
      'cancelada': { cor: 'bg-red-100 text-red-800', texto: '❌ Cancelada', icone: '❌' }
    };
    return statusConfig[status] || { cor: 'bg-gray-100 text-gray-800', texto: status, icone: '📋' };
  };

  // Renderizar informações do entregador
  const renderEntregadorInfo = () => {
    if (!entregadorInfo) return null;
    
    return (
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
          <span>🚚</span> Informações do Entregador
        </h4>
        <div className="space-y-1 text-sm">
          <p><strong>Nome:</strong> {entregadorInfo.nome}</p>
          <p><strong>📞 Telefone:</strong> {entregadorInfo.telefone || 'Não informado'}</p>
          <p><strong>📧 Email:</strong> {entregadorInfo.email}</p>
          <p><strong>🚗 Veículo:</strong> {entregadorInfo.veiculo || 'Não informado'}</p>
          <p><strong>🔢 Placa:</strong> {entregadorInfo.placa || 'Sem placa'}</p>
        </div>
      </div>
    );
  };

  // Renderizar informações do comprador
  const renderCompradorInfo = () => {
    if (!compradorInfo) return null;
    
    return (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <h4 className="font-bold text-green-800 flex items-center gap-2 mb-2">
          <span>👤</span> Informações do Comprador
        </h4>
        <div className="space-y-1 text-sm">
          <p><strong>Nome:</strong> {compradorInfo.nome}</p>
          <p><strong>📞 Telefone:</strong> {compradorInfo.telefone || 'Não informado'}</p>
          <p><strong>📧 Email:</strong> {compradorInfo.email}</p>
          <p><strong>📍 Destino:</strong> {entrega?.destino || 'Não informado'}</p>
        </div>
        <button
          onClick={() => window.open(`https://wa.me/${compradorInfo.telefone?.replace(/\D/g, '')}`)}
          className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition"
        >
          📱 Contactar Comprador
        </button>
      </div>
    );
  };

  // Renderizar informações do vendedor
  const renderVendedorInfo = () => {
    if (!vendedorInfo) return null;
    
    return (
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-2">
          <span>🌾</span> Informações do Vendedor
        </h4>
        <div className="space-y-1 text-sm">
          <p><strong>Nome:</strong> {vendedorInfo.nome}</p>
          <p><strong>📞 Telefone:</strong> {vendedorInfo.telefone || 'Não informado'}</p>
          <p><strong>📧 Email:</strong> {vendedorInfo.email}</p>
          <p><strong>📍 Origem:</strong> {entrega?.origem || produto?.provincia || 'Não informado'}</p>
        </div>
        <button
          onClick={() => window.open(`https://wa.me/${vendedorInfo.telefone?.replace(/\D/g, '')}`)}
          className="mt-3 w-full bg-yellow-600 text-white py-2 rounded-lg text-sm hover:bg-yellow-700 transition"
        >
          📱 Contactar Vendedor
        </button>
      </div>
    );
  };

  // Botões de ação para entregador
  const renderAcoesEntregador = () => {
    if (usuario?.tipo !== 'entregador') return null;
    
    const status = statusEntrega || entrega?.status;
    
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-bold text-gray-800 mb-3">🎮 Ações da Entrega</h4>
        <div className="flex flex-wrap gap-2">
          {status === 'pendente' && (
            <button
              onClick={() => atualizarStatusEntrega('aceita')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Aceitar Entrega
            </button>
          )}
          {status === 'aceita' && (
            <button
              onClick={() => atualizarStatusEntrega('retirada')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
            >
              Produto Retirado
            </button>
          )}
          {status === 'retirada' && (
            <>
              <button
                onClick={() => {
                  atualizarStatusEntrega('transporte');
                  if (rota.length === 0 && localizacaoAtual && compradorInfo) {
                    calcularRota(localizacaoAtual, { lat: -8.839988, lng: 13.289437 });
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
              >
                Iniciar Transporte
              </button>
              {rota.length > 0 && !simulandoMovimento && (
                <button
                  onClick={iniciarSimulacaoMovimento}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                >
                  🚗 Iniciar Navegação
                </button>
              )}
            </>
          )}
          {status === 'transporte' && (
            <button
              onClick={() => atualizarStatusEntrega('entregue')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Confirmar Entrega
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(statusEntrega || entrega?.status || 'pendente');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">🗺️ Rastreamento em Tempo Real</h2>
            <p className="opacity-90">Acompanhe sua entrega ao vivo com GPS</p>
          </div>
          <div className={`px-4 py-2 rounded-full ${statusBadge.cor} text-lg font-semibold`}>
            {statusBadge.icone} {statusBadge.texto}
          </div>
        </div>
      </div>

      {/* Informações da Entrega */}
      <div className="grid md:grid-cols-3 gap-4">
        {renderEntregadorInfo()}
        {renderCompradorInfo()}
        {renderVendedorInfo()}
      </div>

      {/* Mapa Profissional */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>🗺️</span> Mapa de Rastreamento
            {distancia && (
              <span className="text-sm font-normal text-gray-500 ml-4">
                📍 Distância: {distancia} km | ⏱️ Est. {tempoEstimado} min
              </span>
            )}
          </h3>
        </div>
        
        {localizacaoAtual ? (
          <MapContainer
            center={[localizacaoAtual.lat, localizacaoAtual.lng]}
            zoom={14}
            className="h-[500px] w-full"
            whenCreated={setMap}
          >
            {/* Camada de satélite (estilo Google Maps) */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | &copy; <a href="https://carto.com/">CARTO</a>'
              subdomains="abcd"
            />
            
            {/* Camada adicional para ruas */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              opacity={0.5}
            />
            
            {/* Marcador do veículo em movimento */}
            <Marker 
              position={[localizacaoAtual.lat, localizacaoAtual.lng]} 
              icon={vehicleIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold">🚚 Veículo em movimento</p>
                  <p className="text-sm">Velocidade: ~{Math.floor(Math.random() * 40 + 30)} km/h</p>
                  <p className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</p>
                </div>
              </Popup>
            </Marker>
            
            {/* Rota traçada */}
            {rota.length > 0 && (
              <Polyline
                positions={rota}
                color="#2563EB"
                weight={4}
                opacity={0.8}
                dashArray="10, 10"
              />
            )}
            
            {/* Círculo de alcance */}
            <Circle
              center={[localizacaoAtual.lat, localizacaoAtual.lng]}
              radius={500}
              pathOptions={{ color: '#3B82F6', fillColor: '#60A5FA', fillOpacity: 0.1 }}
            />
          </MapContainer>
        ) : (
          <div className="bg-yellow-50 p-8 rounded-lg text-center">
            <p className="text-yellow-800">🌐 Ative sua localização para ver o mapa</p>
            <button
              onClick={obterLocalizacao}
              className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
            >
              Ativar Localização
            </button>
          </div>
        )}
      </div>

      {/* Instruções de Navegação */}
      {instrucaoAtual && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🗺️</div>
            <div className="flex-1">
              <div className="font-bold text-blue-800 text-lg">Próxima instrução</div>
              <p className="text-gray-700 text-base mt-1">{instrucaoAtual.instrucao}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>📏 Distância: {instrucaoAtual.distancia} km</span>
                <span>⏱️ Tempo: {instrucaoAtual.tempo} min</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Instruções Completas */}
      {instrucoes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📋</span> Instruções de Navegação
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {instrucoes.map((inst, idx) => (
              <div 
                key={inst.id}
                className={`p-3 rounded-lg border ${
                  instrucaoAtual?.id === inst.id 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{inst.instrucao}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span>📏 {inst.distancia} km</span>
                      <span>⏱️ {inst.tempo} min</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">#{idx + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações do Entregador */}
      {renderAcoesEntregador()}

      {/* Botões de Contato Rápido */}
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => window.open(`https://wa.me/${entregadorInfo?.telefone?.replace(/\D/g, '') || '244928565837'}`)}
          className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition"
          disabled={!entregadorInfo}
        >
          📱 Falar com Entregador via WhatsApp
        </button>
        <button
          onClick={() => window.open(`tel:${compradorInfo?.telefone || entregadorInfo?.telefone}`)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
        >
          📞 Ligar Agora
        </button>
      </div>
    </div>
  );
}

export default AbaRastreamento;