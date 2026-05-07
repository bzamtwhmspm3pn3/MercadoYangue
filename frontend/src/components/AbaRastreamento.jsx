import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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

// Ícone personalizado
const vehicleIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3096/3096973.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  const [routingControl, setRoutingControl] = useState(null);

  // Carregar entregas do usuário logado
  useEffect(() => {
    carregarMinhasEntregas();
    obterLocalizacao();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (routingControl) routingControl.remove();
    };
  }, [usuario?.id]);

  const carregarMinhasEntregas = async () => {
    if (!usuario?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      let url;
      
      // Buscar entregas baseado no tipo de usuário
      if (usuario.tipo === 'entregador') {
        url = `${API_URL}/entregas/entregador/${usuario.id}`;
      } else if (usuario.tipo === 'vendedor') {
        url = `${API_URL}/entregas/vendedor/${usuario.id}`;
      } else {
        url = `${API_URL}/entregas/cliente/${usuario.id}`;
      }
      
      const response = await axios.get(url);
      const entregas = response.data.data || [];
      
      // Filtrar apenas entregas em andamento (não concluídas)
      const entregasEmAndamento = entregas.filter(e => 
        e.status !== 'entregue' && e.status !== 'cancelada'
      );
      
      setEntregasAtivas(entregasEmAndamento);
      
      // Se houver entregas ativas, selecionar a primeira automaticamente
      if (entregasEmAndamento.length > 0 && !entregaSelecionada) {
        setEntregaSelecionada(entregasEmAndamento[0]);
      }
      
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      setEntregasAtivas([]);
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
          setLocalizacaoAtual({ lat: -8.839988, lng: 13.289437 }); // Luanda
        }
      );
    }
  };

  const calcularRota = async (origem, destino) => {
    if (!origem || !destino) return;
    
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
    }
  };

  const iniciarRastreamento = (entrega) => {
    setEntregaSelecionada(entrega);
    
    // Calcular rota da origem para o destino
    if (localizacaoAtual && entrega.destino) {
      // Simular coordenadas do destino (em produção, viriam do backend)
      const destinoCoords = { lat: -8.839988, lng: 13.289437 };
      calcularRota(localizacaoAtual, destinoCoords);
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
        carregarMinhasEntregas(); // Recarregar lista
      }
    }, 2000);
    setIntervalId(intervalo);
  };

  const atualizarStatusEntrega = async (novoStatus) => {
    if (!entregaSelecionada?._id) return;
    
    try {
      await axios.put(`${API_URL}/entregas/${entregaSelecionada._id}/status`, {
        status: novoStatus,
        localizacao: localizacaoAtual
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
      'pendente': { cor: 'bg-yellow-100 text-yellow-800', texto: 'Pendente' },
      'aceita': { cor: 'bg-blue-100 text-blue-800', texto: 'Aceita' },
      'retirada': { cor: 'bg-purple-100 text-purple-800', texto: 'Produto Retirado' },
      'transporte': { cor: 'bg-orange-100 text-orange-800', texto: 'Em Transporte' },
      'entregue': { cor: 'bg-green-100 text-green-800', texto: 'Entregue' }
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
        {usuario?.tipo === 'entregador' && (
          <button 
            onClick={() => window.location.href = '/logistica'}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Ver solicitações de entrega
          </button>
        )}
      </div>
    );
  }

  // Selecionar entrega se ainda não selecionada
  if (!entregaSelecionada && entregasAtivas.length > 0) {
    setEntregaSelecionada(entregasAtivas[0]);
  }

  const statusBadge = getStatusBadge(entregaSelecionada?.status);
  const isEntregador = usuario?.tipo === 'entregador';
  const isCliente = usuario?.tipo === 'cliente';
  const isVendedor = usuario?.tipo === 'vendedor';

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

      {/* Seleção de Entrega (se houver múltiplas) */}
      {entregasAtivas.length > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Selecione uma entrega</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {entregasAtivas.map(entrega => (
              <button
                key={entrega._id}
                onClick={() => iniciarRastreamento(entrega)}
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
              <h4 className="font-bold text-blue-800 mb-2">Entregador</h4>
              <p className="text-sm"><strong>Nome:</strong> {entregaSelecionada.entregadorId.nome}</p>
              <p className="text-sm"><strong>Telefone:</strong> {entregaSelecionada.entregadorId.telefone || 'Nao informado'}</p>
              <p className="text-sm"><strong>Veículo:</strong> {entregaSelecionada.entregadorId.veiculo || 'Nao informado'}</p>
              <button
                onClick={() => window.open(`https://wa.me/${entregaSelecionada.entregadorId.telefone?.replace(/\D/g, '')}`)}
                className="mt-2 w-full bg-blue-600 text-white py-1 rounded-lg text-sm"
              >
                Contactar via WhatsApp
              </button>
            </div>
          )}

          {/* Cliente */}
          {entregaSelecionada.clienteId && (isEntregador || isVendedor) && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-bold text-green-800 mb-2">Comprador</h4>
              <p className="text-sm"><strong>Nome:</strong> {entregaSelecionada.clienteId.nome}</p>
              <p className="text-sm"><strong>Telefone:</strong> {entregaSelecionada.clienteId.telefone || 'Nao informado'}</p>
              <p className="text-sm"><strong>Destino:</strong> {entregaSelecionada.destino}</p>
              <button
                onClick={() => window.open(`https://wa.me/${entregaSelecionada.clienteId.telefone?.replace(/\D/g, '')}`)}
                className="mt-2 w-full bg-green-600 text-white py-1 rounded-lg text-sm"
              >
                Contactar via WhatsApp
              </button>
            </div>
          )}

          {/* Vendedor */}
          {entregaSelecionada.produtoId?.vendedorId && (isCliente || isEntregador) && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h4 className="font-bold text-yellow-800 mb-2">Vendedor</h4>
              <p className="text-sm"><strong>Nome:</strong> {entregaSelecionada.produtoId.vendedorId.nome}</p>
              <p className="text-sm"><strong>Origem:</strong> {entregaSelecionada.origem}</p>
              <button
                onClick={() => window.open(`https://wa.me/${entregaSelecionada.produtoId.vendedorId.telefone?.replace(/\D/g, '')}`)}
                className="mt-2 w-full bg-yellow-600 text-white py-1 rounded-lg text-sm"
              >
                Contactar via WhatsApp
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mapa */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-bold text-gray-800">
            Rota de Entrega
            {distancia && (
              <span className="text-sm font-normal text-gray-500 ml-3">
                Distancia: {distancia} km | Tempo estimado: {tempoEstimado} min
              </span>
            )}
          </h3>
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
            
            <Marker position={[localizacaoAtual.lat, localizacaoAtual.lng]} icon={vehicleIcon}>
              <Popup>Veiculo em movimento</Popup>
            </Marker>
            
            {rota.length > 0 && (
              <Polyline positions={rota} color="#2563EB" weight={4} opacity={0.8} />
            )}
          </MapContainer>
        ) : (
          <div className="bg-yellow-50 p-8 text-center">
            <p>Ative sua localização para ver o mapa</p>
            <button onClick={obterLocalizacao} className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded-lg">
              Ativar Localização
            </button>
          </div>
        )}
      </div>

      {/* Instruções */}
      {instrucaoAtual && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="font-bold text-blue-800">Proxima instrucao</p>
          <p className="text-gray-700 mt-1">{instrucaoAtual.instrucao}</p>
          <p className="text-xs text-gray-500 mt-1">Distancia: {instrucaoAtual.distancia} km | Tempo: {instrucaoAtual.tempo} min</p>
        </div>
      )}

      {/* Ações do Entregador */}
      {isEntregador && entregaSelecionada && (
        <div className="bg-gray-50 rounded-xl p-4 border">
          <h4 className="font-bold mb-2">Acoes da Entrega</h4>
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
                    if (rota.length === 0 && localizacaoAtual) {
                      calcularRota(localizacaoAtual, { lat: -8.839988, lng: 13.289437 });
                    }
                  }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Iniciar Transporte
                </button>
                {rota.length > 0 && !simulandoMovimento && (
                  <button onClick={iniciarSimulacaoMovimento} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
                    Iniciar Navegacao
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