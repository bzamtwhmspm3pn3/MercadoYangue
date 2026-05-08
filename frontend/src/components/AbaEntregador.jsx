import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AbaEntregador({ usuario }) {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localizacao, setLocalizacao] = useState(null);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfil, setPerfil] = useState({
    telefone: '',
    veiculo: '',
    placa: '',
    corVeiculo: '',
    anoVeiculo: '',
    capacidadeCarga: '',
    tarifaBase: 1500,
    disponivel: true
  });

  // Obter ID do usuário corretamente
  const getUserId = () => usuario?.id || usuario?._id;
  const userId = getUserId();

  // Carregar dados do entregador
  useEffect(() => {
    const carregarDados = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        
        // Carregar perfil
        const perfilRes = await axios.get(`${API_URL}/usuarios/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (perfilRes.data.success) {
          const userData = perfilRes.data.data;
          setPerfil({
            telefone: userData.telefone || '',
            veiculo: userData.veiculo || '',
            placa: userData.placa || '',
            corVeiculo: userData.corVeiculo || '',
            anoVeiculo: userData.anoVeiculo || '',
            capacidadeCarga: userData.capacidadeCarga || '',
            tarifaBase: userData.tarifaBase || 1500,
            disponivel: userData.disponivel !== false
          });
        }
        
        // Carregar entregas
        const entregasRes = await axios.get(`${API_URL}/entregas/entregador/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setEntregas(entregasRes.data.data || []);
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
    
    // Ativar localização
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocalizacao({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => console.error('Erro ao obter localização:', err)
      );
    }
  }, [userId]);

  const salvarPerfil = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/usuarios/${userId}`, perfil, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Perfil atualizado com sucesso!');
      setEditandoPerfil(false);
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil');
    }
  };

  const atualizarLocalizacao = async () => {
    if (!localizacao) {
      alert('Ative sua localização primeiro');
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/entregadores/${userId}/localizacao`, localizacao, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Localização atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      alert('Erro ao atualizar localização');
    }
  };

  const atualizarStatus = async (entregaId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/entregas/${entregaId}/status`, 
        { status, localizacao },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Status atualizado para: ${status}`);
      
      // Recarregar entregas
      const entregasRes = await axios.get(`${API_URL}/entregas/entregador/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntregas(entregasRes.data.data || []);
      
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

  if (!userId) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow">
        <p className="text-gray-500">Usuário não autenticado. Faça login para acessar.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold">🚚 Area do Entregador</h2>
        <p className="opacity-90">Gerencie seu perfil, entregas e localizacao</p>
      </div>

      {/* Perfil do Entregador */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">📋 Meu Perfil</h3>
          <button
            onClick={() => setEditandoPerfil(!editandoPerfil)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            {editandoPerfil ? 'Cancelar' : 'Editar Perfil'}
          </button>
        </div>
        
        <div className="p-6">
          {!editandoPerfil ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p><strong>Nome:</strong> {usuario?.nome}</p>
                <p><strong>Email:</strong> {usuario?.email}</p>
                <p><strong>Telefone:</strong> {perfil.telefone || 'Nao informado'}</p>
                <p><strong>Veiculo:</strong> {perfil.veiculo || 'Nao informado'}</p>
                <p><strong>Placa:</strong> {perfil.placa || 'Nao informada'}</p>
              </div>
              <div>
                <p><strong>Cor do Veiculo:</strong> {perfil.corVeiculo || 'Nao informada'}</p>
                <p><strong>Ano do Veiculo:</strong> {perfil.anoVeiculo || 'Nao informado'}</p>
                <p><strong>Capacidade de Carga:</strong> {perfil.capacidadeCarga || 'Nao informada'} kg</p>
                <p><strong>Tarifa Base:</strong> Kz {perfil.tarifaBase.toLocaleString()}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${perfil.disponivel ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {perfil.disponivel ? 'Disponivel' : 'Indisponivel'}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input type="tel" value={perfil.telefone} onChange={(e) => setPerfil({...perfil, telefone: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Veiculo</label>
                  <input type="text" value={perfil.veiculo} onChange={(e) => setPerfil({...perfil, veiculo: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Placa</label>
                  <input type="text" value={perfil.placa} onChange={(e) => setPerfil({...perfil, placa: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cor do Veiculo</label>
                  <input type="text" value={perfil.corVeiculo} onChange={(e) => setPerfil({...perfil, corVeiculo: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ano do Veiculo</label>
                  <input type="number" value={perfil.anoVeiculo} onChange={(e) => setPerfil({...perfil, anoVeiculo: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacidade de Carga (kg)</label>
                  <input type="number" value={perfil.capacidadeCarga} onChange={(e) => setPerfil({...perfil, capacidadeCarga: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tarifa Base (Kz)</label>
                  <input type="number" value={perfil.tarifaBase} onChange={(e) => setPerfil({...perfil, tarifaBase: parseFloat(e.target.value)})} className="w-full border rounded-lg p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Disponivel</label>
                  <select value={perfil.disponivel} onChange={(e) => setPerfil({...perfil, disponivel: e.target.value === 'true'})} className="w-full border rounded-lg p-2 mt-1">
                    <option value="true">Sim</option>
                    <option value="false">Nao</option>
                  </select>
                </div>
              </div>
              <button onClick={salvarPerfil} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Salvar Perfil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Localização */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">📍 Sua Localizacao Atual</h3>
        {localizacao ? (
          <div className="space-y-3">
            <p className="text-green-600">✓ Localizacao ativa</p>
            <p className="text-sm text-gray-500">Lat: {localizacao.lat.toFixed(4)} | Lng: {localizacao.lng.toFixed(4)}</p>
            <button onClick={atualizarLocalizacao} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              Atualizar Localizacao
            </button>
          </div>
        ) : (
          <button onClick={() => navigator.geolocation.getCurrentPosition(pos => setLocalizacao(pos.coords))} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Ativar Localizacao
          </button>
        )}
      </div>

      {/* Entregas Designadas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">📋 Entregas Designadas</h3>
        {entregas.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma entrega designada no momento</p>
        ) : (
          <div className="space-y-4">
            {entregas.map(entrega => {
              const statusBadge = getStatusBadge(entrega.status);
              return (
                <div key={entrega._id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.cor}`}>
                      {statusBadge.texto}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(entrega.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p><strong>Cliente:</strong> {entrega.clienteId?.nome || 'Cliente'}</p>
                  <p><strong>Telefone:</strong> {entrega.clienteId?.telefone || 'Nao informado'}</p>
                  <p><strong>Destino:</strong> {entrega.destino}</p>
                  <p><strong>Valor:</strong> Kz {(entrega.valorFrete || perfil.tarifaBase).toLocaleString()}</p>
                  {entrega.observacoes && <p className="text-sm text-gray-500"><strong>Obs:</strong> {entrega.observacoes}</p>}
                  
                  <div className="flex gap-2 mt-3">
                    {entrega.status === 'pendente' && (
                      <button onClick={() => atualizarStatus(entrega._id, 'aceita')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                        Aceitar Entrega
                      </button>
                    )}
                    {entrega.status === 'aceita' && (
                      <button onClick={() => atualizarStatus(entrega._id, 'retirada')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        Produto Retirado
                      </button>
                    )}
                    {entrega.status === 'retirada' && (
                      <button onClick={() => atualizarStatus(entrega._id, 'entregue')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                        Confirmar Entrega
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dicas */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h4 className="font-bold text-blue-800 mb-2">💡 Dicas para Entregadores</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Mantenha sua localizacao ativa para receber entregas</li>
          <li>• Atualize o status da entrega em cada etapa</li>
          <li>• Mantenha seus dados de contato atualizados</li>
          <li>• Seja pontual para garantir boas avaliacoes</li>
        </ul>
      </div>
    </div>
  );
}

export default AbaEntregador;