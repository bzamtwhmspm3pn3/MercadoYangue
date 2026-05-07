import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AbaEntregador({ usuario }) {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    telefone: '',
    veiculo: '',
    placa: '',
    corVeiculo: '',
    anoVeiculo: '',
    capacidadeCarga: '',
    rotasPreferenciais: [],
    tarifaBase: 1500,
    disponivel: true,
    areasAtuacao: [],
    historicoNegociacoes: []
  });
  const [novaRota, setNovaRota] = useState('');
  const [novaArea, setNovaArea] = useState('');
  const [modalNegociacao, setModalNegociacao] = useState(false);
  const [entregaSelecionada, setEntregaSelecionada] = useState(null);
  const [contraProposta, setContraProposta] = useState('');
  const [mensagemNegociacao, setMensagemNegociacao] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [avaliacao, setAvaliacao] = useState(null);
  const [comentario, setComentario] = useState('');
  const [mostrarAvaliacao, setMostrarAvaliacao] = useState(false);

  // Carregar dados do entregador
  useEffect(() => {
    carregarDados();
  }, [usuario?.id]);

  const carregarDados = async () => {
    if (!usuario?.id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Carregar perfil do entregador
      const perfilRes = await axios.get(`${API_URL}/usuarios/${usuario.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (perfilRes.data.success) {
        const userData = perfilRes.data.data;
        setPerfil(prev => ({
          ...prev,
          nome: userData.nome || '',
          email: userData.email || '',
          telefone: userData.telefone || '',
          veiculo: userData.veiculo || '',
          placa: userData.placa || '',
          corVeiculo: userData.corVeiculo || '',
          anoVeiculo: userData.anoVeiculo || '',
          capacidadeCarga: userData.capacidadeCarga || '',
          rotasPreferenciais: userData.rotasPreferenciais || [],
          tarifaBase: userData.tarifaBase || 1500,
          disponivel: userData.disponivel !== false,
          areasAtuacao: userData.areasAtuacao || []
        }));
      }
      
      // Carregar entregas do entregador
      const entregasRes = await axios.get(`${API_URL}/entregas/entregador/${usuario.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEntregas(entregasRes.data.data || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarPerfil = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/usuarios/${usuario.id}`, {
        telefone: perfil.telefone,
        veiculo: perfil.veiculo,
        placa: perfil.placa,
        corVeiculo: perfil.corVeiculo,
        anoVeiculo: perfil.anoVeiculo,
        capacidadeCarga: perfil.capacidadeCarga,
        rotasPreferenciais: perfil.rotasPreferenciais,
        tarifaBase: perfil.tarifaBase,
        areasAtuacao: perfil.areasAtuacao
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Perfil atualizado com sucesso!');
      setEditandoPerfil(false);
      carregarDados();
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    }
  };

  const adicionarRotaPreferencial = () => {
    if (novaRota.trim() && !perfil.rotasPreferenciais.includes(novaRota.trim())) {
      setPerfil(prev => ({
        ...prev,
        rotasPreferenciais: [...prev.rotasPreferenciais, novaRota.trim()]
      }));
      setNovaRota('');
    }
  };

  const removerRotaPreferencial = (rota) => {
    setPerfil(prev => ({
      ...prev,
      rotasPreferenciais: prev.rotasPreferenciais.filter(r => r !== rota)
    }));
  };

  const adicionarAreaAtuacao = () => {
    if (novaArea.trim() && !perfil.areasAtuacao.includes(novaArea.trim())) {
      setPerfil(prev => ({
        ...prev,
        areasAtuacao: [...prev.areasAtuacao, novaArea.trim()]
      }));
      setNovaArea('');
    }
  };

  const removerAreaAtuacao = (area) => {
    setPerfil(prev => ({
      ...prev,
      areasAtuacao: prev.areasAtuacao.filter(a => a !== area)
    }));
  };

  const atualizarStatusEntrega = async (entregaId, novoStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/entregas/${entregaId}/status`, {
        status: novoStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`Status atualizado para: ${novoStatus}`);
      carregarDados();
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const iniciarNegociacao = (entrega) => {
    setEntregaSelecionada(entrega);
    setContraProposta('');
    setMensagemNegociacao('');
    setModalNegociacao(true);
  };

  const enviarNegociacao = async () => {
    if (!contraProposta) {
      alert('Informe sua contra-proposta');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/entregas/${entregaSelecionada._id}/negociar`, {
        valorProposto: parseFloat(contraProposta),
        mensagem: mensagemNegociacao,
        entregadorId: usuario.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Proposta enviada para o cliente!');
      setModalNegociacao(false);
      carregarDados();
      
    } catch (error) {
      console.error('Erro ao negociar:', error);
      alert('Erro ao enviar proposta');
    }
  };

  const enviarAvaliacao = async (entregaId, nota, comentarioTexto) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/avaliacoes/entregador`, {
        entregaId,
        nota,
        comentario: comentarioTexto
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Avaliação enviada com sucesso! Obrigado!');
      setMostrarAvaliacao(false);
      setAvaliacao(null);
      setComentario('');
      carregarDados();
      
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      alert('Erro ao enviar avaliação');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'pendente': { cor: 'bg-yellow-100 text-yellow-800', texto: 'Pendente' },
      'aceita': { cor: 'bg-blue-100 text-blue-800', texto: 'Aceita' },
      'retirada': { cor: 'bg-purple-100 text-purple-800', texto: 'Produto Retirado' },
      'transporte': { cor: 'bg-orange-100 text-orange-800', texto: 'Em Transporte' },
      'entregue': { cor: 'bg-green-100 text-green-800', texto: 'Entregue' },
      'negociacao': { cor: 'bg-pink-100 text-pink-800', texto: 'Em Negociacao' },
      'cancelada': { cor: 'bg-red-100 text-red-800', texto: 'Cancelada' }
    };
    return config[status] || { cor: 'bg-gray-100', texto: status };
  };

  const entregasFiltradas = entregas.filter(entrega => {
    if (filtroStatus === 'todas') return true;
    return entrega.status === filtroStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Cabecalho */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold">🚚 Area do Entregador</h2>
        <p className="opacity-90">Gerencie seu perfil, entregas e negociacoes</p>
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
                <p><strong>Nome:</strong> {perfil.nome}</p>
                <p><strong>Email:</strong> {perfil.email}</p>
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
              {perfil.rotasPreferenciais.length > 0 && (
                <div className="md:col-span-2">
                  <p><strong>Rotas Preferenciais:</strong> {perfil.rotasPreferenciais.join(', ')}</p>
                </div>
              )}
              {perfil.areasAtuacao.length > 0 && (
                <div className="md:col-span-2">
                  <p><strong>Areas de Atuacao:</strong> {perfil.areasAtuacao.join(', ')}</p>
                </div>
              )}
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
                  <input type="text" value={perfil.veiculo} onChange={(e) => setPerfil({...perfil, veiculo: e.target.value})} className="w-full border rounded-lg p-2 mt-1" placeholder="Ex: Toyota Hilux" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Placa</label>
                  <input type="text" value={perfil.placa} onChange={(e) => setPerfil({...perfil, placa: e.target.value})} className="w-full border rounded-lg p-2 mt-1" placeholder="Ex: LD-12-34-AB" />
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
              
              {/* Rotas Preferenciais */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Rotas Preferenciais</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={novaRota} onChange={(e) => setNovaRota(e.target.value)} className="flex-1 border rounded-lg p-2" placeholder="Ex: Luanda - Viana" />
                  <button onClick={adicionarRotaPreferencial} className="px-3 py-2 bg-green-600 text-white rounded-lg">Adicionar</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {perfil.rotasPreferenciais.map((rota, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                      {rota}
                      <button onClick={() => removerRotaPreferencial(rota)} className="ml-1 text-red-500 hover:text-red-700">x</button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Areas de Atuacao */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Areas de Atuacao</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={novaArea} onChange={(e) => setNovaArea(e.target.value)} className="flex-1 border rounded-lg p-2" placeholder="Ex: Luanda, Benguela, Huambo" />
                  <button onClick={adicionarAreaAtuacao} className="px-3 py-2 bg-green-600 text-white rounded-lg">Adicionar</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {perfil.areasAtuacao.map((area, idx) => (
                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                      {area}
                      <button onClick={() => removerAreaAtuacao(area)} className="ml-1 text-red-500 hover:text-red-700">x</button>
                    </span>
                  ))}
                </div>
              </div>
              
              <button onClick={salvarPerfil} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Salvar Perfil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros de Entregas */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-wrap gap-2">
          {['todas', 'pendente', 'aceita', 'retirada', 'transporte', 'entregue', 'negociacao'].map(status => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-3 py-1 rounded-full text-sm transition ${filtroStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {status === 'todas' ? 'Todas' : getStatusBadge(status).texto}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Entregas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Minhas Entregas</h3>
        
        {entregasFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">📦</p>
            <p>Nenhuma entrega encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entregasFiltradas.map(entrega => {
              const statusBadge = getStatusBadge(entrega.status);
              return (
                <div key={entrega._id} className="border rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.cor}`}>
                          {statusBadge.texto}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(entrega.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm"><strong>Cliente:</strong> {entrega.clienteId?.nome || 'Cliente'}</p>
                      <p className="text-sm"><strong>Telefone:</strong> {entrega.clienteId?.telefone || 'Nao informado'}</p>
                      <p className="text-sm"><strong>Origem:</strong> {entrega.origem}</p>
                      <p className="text-sm"><strong>Destino:</strong> {entrega.destino}</p>
                      <p className="text-sm"><strong>Valor Frete:</strong> Kz {(entrega.valorFrete || perfil.tarifaBase).toLocaleString()}</p>
                      {entrega.observacoes && <p className="text-sm text-gray-500"><strong>Observacoes:</strong> {entrega.observacoes}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setModalDetalhes(entrega)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                      >
                        Detalhes
                      </button>
                      {entrega.status === 'pendente' && (
                        <button
                          onClick={() => iniciarNegociacao(entrega)}
                          className="px-3 py-1 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700"
                        >
                          Negociar
                        </button>
                      )}
                      {entrega.status === 'pendente' && (
                        <button
                          onClick={() => atualizarStatusEntrega(entrega._id, 'aceita')}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                          Aceitar
                        </button>
                      )}
                      {entrega.status === 'aceita' && (
                        <button
                          onClick={() => atualizarStatusEntrega(entrega._id, 'retirada')}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                        >
                          Produto Retirado
                        </button>
                      )}
                      {entrega.status === 'retirada' && (
                        <button
                          onClick={() => atualizarStatusEntrega(entrega._id, 'transporte')}
                          className="px-3 py-1 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
                        >
                          Iniciar Transporte
                        </button>
                      )}
                      {entrega.status === 'transporte' && (
                        <button
                          onClick={() => atualizarStatusEntrega(entrega._id, 'entregue')}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          Confirmar Entrega
                        </button>
                      )}
                      {entrega.status === 'entregue' && !entrega.avaliado && (
                        <button
                          onClick={() => {
                            setEntregaSelecionada(entrega);
                            setMostrarAvaliacao(true);
                          }}
                          className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                        >
                          Avaliar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Negociacao */}
      {modalNegociacao && entregaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Negociar Frete</h3>
            <p className="text-sm text-gray-600 mb-2">Cliente: {entregaSelecionada.clienteId?.nome}</p>
            <p className="text-sm text-gray-600 mb-2">Valor atual: Kz {entregaSelecionada.valorFrete?.toLocaleString() || perfil.tarifaBase.toLocaleString()}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Sua contra-proposta (Kz)</label>
              <input
                type="number"
                value={contraProposta}
                onChange={(e) => setContraProposta(e.target.value)}
                className="w-full border rounded-lg p-2 mt-1"
                placeholder="Valor proposto"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Mensagem para o cliente</label>
              <textarea
                value={mensagemNegociacao}
                onChange={(e) => setMensagemNegociacao(e.target.value)}
                rows="3"
                className="w-full border rounded-lg p-2 mt-1"
                placeholder="Explique sua proposta..."
              />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setModalNegociacao(false)} className="flex-1 py-2 bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={enviarNegociacao} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Enviar Proposta</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Avaliacao */}
      {mostrarAvaliacao && entregaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Avaliar Cliente</h3>
            <p className="text-sm text-gray-600 mb-2">Entrega para: {entregaSelecionada.clienteId?.nome}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nota</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setAvaliacao(star)}
                    className={`text-2xl ${avaliacao >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Comentario</label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows="3"
                className="w-full border rounded-lg p-2 mt-1"
                placeholder="Descreva sua experiencia com este cliente..."
              />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setMostrarAvaliacao(false)} className="flex-1 py-2 bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={() => enviarAvaliacao(entregaSelecionada._id, avaliacao || 5, comentario)} className="flex-1 py-2 bg-yellow-600 text-white rounded-lg">Enviar Avaliacao</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {modalDetalhes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detalhes da Entrega</h3>
            <div className="space-y-2">
              <p><strong>Status:</strong> {getStatusBadge(modalDetalhes.status).texto}</p>
              <p><strong>Solicitada em:</strong> {new Date(modalDetalhes.createdAt).toLocaleString()}</p>
              <p><strong>Cliente:</strong> {modalDetalhes.clienteId?.nome}</p>
              <p><strong>Telefone:</strong> {modalDetalhes.clienteId?.telefone}</p>
              <p><strong>Origem:</strong> {modalDetalhes.origem}</p>
              <p><strong>Destino:</strong> {modalDetalhes.destino}</p>
              <p><strong>Valor Frete:</strong> Kz {(modalDetalhes.valorFrete || perfil.tarifaBase).toLocaleString()}</p>
              {modalDetalhes.observacoes && <p><strong>Observacoes:</strong> {modalDetalhes.observacoes}</p>}
              {modalDetalhes.dataEntrega && <p><strong>Data Entrega:</strong> {new Date(modalDetalhes.dataEntrega).toLocaleString()}</p>}
            </div>
            <button onClick={() => setModalDetalhes(null)} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg">Fechar</button>
          </div>
        </div>
      )}

      {/* Dicas Rapidas */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h4 className="font-bold text-blue-800 mb-2">💡 Dicas para Entregadores</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Mantenha seu perfil sempre atualizado</li>
          <li>• Esteja disponivel para receber novas entregas</li>
          <li>• Negocie fretes de forma justa com os clientes</li>
          <li>• Atualize o status da entrega em cada etapa</li>
          <li>• Avalie os clientes para construir uma boa reputacao</li>
        </ul>
      </div>
    </div>
  );
}

export default AbaEntregador;