import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AbaEntregador({ usuario }) {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localizacao, setLocalizacao] = useState(null);

  useEffect(() => {
    carregarEntregas();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => setLocalizacao({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
    }
  }, []);

  const carregarEntregas = async () => {
    try {
      const res = await axios.get(`${API_URL}/entregas/entregador/${usuario?.id}`);
      setEntregas(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (entregaId, status) => {
    try {
      await axios.put(`${API_URL}/entregas/${entregaId}/status`, { status, localizacao });
      alert(`Status atualizado para: ${status}`);
      carregarEntregas();
    } catch (error) {
      alert('Erro ao atualizar status');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold">🚚 Área do Entregador</h2>
        <p className="opacity-90">Gerencie suas entregas em tempo real</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">📍 Sua Localização Atual</h3>
        {localizacao ? (
          <p className="text-green-600">✓ Localização ativa - Entregadores próximos podem ver você</p>
        ) : (
          <button onClick={() => navigator.geolocation.getCurrentPosition(pos => setLocalizacao(pos.coords))} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Ativar Localização</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">📋 Entregas Designadas</h3>
        {loading ? <p>Carregando...</p> : entregas.length === 0 ? <p className="text-gray-500">Nenhuma entrega designada</p> : (
          <div className="space-y-4">
            {entregas.map(entrega => (
              <div key={entrega._id} className="border rounded-lg p-4">
                <p><strong>Cliente:</strong> {entrega.cliente?.nome}</p>
                <p><strong>Destino:</strong> {entrega.destino}</p>
                <p><strong>Status:</strong> <span className="capitalize">{entrega.status}</span></p>
                <div className="flex gap-2 mt-3">
                  {entrega.status === 'pendente' && <button onClick={() => atualizarStatus(entrega._id, 'aceita')} className="bg-green-600 text-white px-3 py-1 rounded">Aceitar</button>}
                  {entrega.status === 'aceita' && <button onClick={() => atualizarStatus(entrega._id, 'retirada')} className="bg-blue-600 text-white px-3 py-1 rounded">Produto Retirado</button>}
                  {entrega.status === 'retirada' && <button onClick={() => atualizarStatus(entrega._id, 'entregue')} className="bg-green-600 text-white px-3 py-1 rounded">Confirmar Entrega</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AbaEntregador;