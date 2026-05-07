import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Corrigir ícone do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AbaRastreamento({ usuario, produtoId, produto }) {
  const [rastreamento, setRastreamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [produtoresProximos, setProdutoresProximos] = useState([]);
  const [localizacaoAtual, setLocalizacaoAtual] = useState(null);
  const [novaEtapa, setNovaEtapa] = useState('');
  const [observacao, setObservacao] = useState('');

  const etapas = ['plantio', 'crescimento', 'colheita', 'transporte', 'entrega'];
  const etapasLabels = {
    plantio: '🌱 Plantio',
    crescimento: '🌿 Crescimento',
    colheita: '🌾 Colheita',
    transporte: '🚚 Transporte',
    entrega: '📦 Entregue'
  };

  useEffect(() => {
    carregarRastreamento();
    obterLocalizacao();
    buscarProdutoresProximos();
  }, [produtoId]);

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
        }
      );
    }
  };

  const carregarRastreamento = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/geolocalizacao/produto/${produtoId}`);
      if (response.data.success && response.data.data) {
        setRastreamento(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar rastreamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarProdutoresProximos = async () => {
    try {
      if (localizacaoAtual) {
        const response = await axios.get(`${API_URL}/geolocalizacao/produtores-proximos`, {
          params: {
            lat: localizacaoAtual.lat,
            lng: localizacaoAtual.lng,
            raioKm: 50
          }
        });
        setProdutoresProximos(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar produtores:', error);
    }
  };

  const iniciarRastreamento = async () => {
    if (!localizacaoAtual) {
      alert('Ative sua localização para continuar');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/geolocalizacao/iniciar`, {
        produtoId,
        vendedorId: usuario?.id,
        localizacao: {
          lat: localizacaoAtual.lat,
          lng: localizacaoAtual.lng,
          provincia: produto?.provincia || 'Desconhecida',
          municipio: produto?.municipio || 'Desconhecido'
        },
        areaCultivo: 1.0
      });

      if (response.data.success) {
        alert('Rastreamento iniciado com sucesso!');
        carregarRastreamento();
      }
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error);
      alert('Erro ao iniciar rastreamento');
    }
  };

  const atualizarEtapa = async () => {
    if (!novaEtapa) {
      alert('Selecione uma etapa');
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/geolocalizacao/atualizar/${rastreamento._id}`, {
        etapa: novaEtapa,
        localizacao: {
          lat: localizacaoAtual?.lat || rastreamento.localizacaoAtual?.lat,
          lng: localizacaoAtual?.lng || rastreamento.localizacaoAtual?.lng,
          provincia: produto?.provincia,
          municipio: produto?.municipio
        },
        observacao
      });

      if (response.data.success) {
        alert(`Etapa atualizada para: ${etapasLabels[novaEtapa]}`);
        setNovaEtapa('');
        setObservacao('');
        carregarRastreamento();
      }
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      alert('Erro ao atualizar etapa');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🗺️ Rastreabilidade da Produção</h2>
        <p className="opacity-90">Acompanhe a origem e o caminho dos produtos do campo até a sua mesa</p>
      </div>

      {/* Mapa */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">📍 Localização do Produto</h3>
        {localizacaoAtual ? (
          <MapContainer
            center={[localizacaoAtual.lat, localizacaoAtual.lng]}
            zoom={13}
            className="h-96 rounded-lg"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[localizacaoAtual.lat, localizacaoAtual.lng]}>
              <Popup>
                {produto?.nome || 'Produto'} - {rastreamento?.status || 'Localização atual'}
              </Popup>
            </Marker>
            {rastreamento?.historico?.map((h, idx) => (
              <Circle
                key={idx}
                center={[h.lat, h.lng]}
                radius={500}
                pathOptions={{ color: 'green', fillColor: 'lightgreen', fillOpacity: 0.3 }}
              />
            ))}
          </MapContainer>
        ) : (
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-yellow-800">🌐 Ative sua localização para ver o mapa</p>
            <button
              onClick={obterLocalizacao}
              className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Ativar Localização
            </button>
          </div>
        )}
      </div>

      {/* Status do Rastreamento */}
      {rastreamento ? (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Status da Produção</h3>
            <div className="flex flex-wrap gap-3 mb-6">
              {etapas.map((etapa, idx) => {
                const isActive = rastreamento.status === etapa;
                const isCompleted = etapas.indexOf(rastreamento.status) > idx;
                return (
                  <div
                    key={etapa}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
                      isActive ? 'bg-green-600 text-white' :
                      isCompleted ? 'bg-green-200 text-green-800' :
                      'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <span>{etapasLabels[etapa]}</span>
                    {isActive && <span className="ml-1">✔️</span>}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Área de Cultivo:</strong> {rastreamento.areaCultivo || 'Não informada'} hectares</div>
              <div><strong>Data de Início:</strong> {new Date(rastreamento.createdAt).toLocaleDateString()}</div>
              {rastreamento.previsaoColheita && (
                <div><strong>Previsão de Colheita:</strong> {new Date(rastreamento.previsaoColheita).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          {/* Atualizar Etapa (apenas para vendedores) */}
          {(usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor') && (
            <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
              <h3 className="text-lg font-bold text-green-800 mb-4">🔄 Atualizar Etapa de Produção</h3>
              <div className="flex flex-wrap gap-4">
                <select
                  value={novaEtapa}
                  onChange={(e) => setNovaEtapa(e.target.value)}
                  className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione a nova etapa</option>
                  {etapas.map(etapa => (
                    <option key={etapa} value={etapa} disabled={etapas.indexOf(etapa) <= etapas.indexOf(rastreamento.status)}>
                      {etapasLabels[etapa]}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Observação (opcional)"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={atualizarEtapa}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Atualizar
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        // Iniciar Rastreamento (apenas para vendedores)
        (usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor') && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Produto ainda não rastreado</h3>
            <p className="text-gray-600 mb-4">Inicie o rastreamento para acompanhar toda a jornada do produto</p>
            <button
              onClick={iniciarRastreamento}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Iniciar Rastreamento
            </button>
          </div>
        )
      )}

      {/* Produtores Próximos */}
      {produtoresProximos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🤝 Produtores Próximos</h3>
          <div className="space-y-3">
            {produtoresProximos.slice(0, 5).map((prod, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-3">
                <div>
                  <div className="font-semibold">{prod.vendedorId?.nome || 'Produtor'}</div>
                  <div className="text-sm text-gray-500">{prod.produtoId?.nome} - {prod.status}</div>
                </div>
                <button
                  onClick={() => window.open(`https://wa.me/${prod.contacto || '244900000000'}`)}
                  className="bg-green-500 text-white px-4 py-1 rounded-full text-sm hover:bg-green-600"
                >
                  📱 Contactar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {rastreamento?.historico?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📜 Histórico de Localizações</h3>
          <div className="space-y-3">
            {rastreamento.historico.slice().reverse().map((h, idx) => (
              <div key={idx} className="flex items-start gap-3 border-b pb-2">
                <div className="w-24 text-sm text-gray-500">{new Date(h.timestamp).toLocaleDateString()}</div>
                <div className="flex-1">
                  <span className="font-semibold">{etapasLabels[h.etapa]}</span>
                  <div className="text-sm text-gray-600">{h.provincia}, {h.municipio}</div>
                  {h.observacao && <div className="text-xs text-gray-400 mt-1">"{h.observacao}"</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AbaRastreamento;