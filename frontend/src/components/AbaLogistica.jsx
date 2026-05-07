import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Componente de Loading
const LoadingSpinner = () => (
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Componente de Mensagem de Login
const LoginMessage = ({ setAbaAtiva }) => (
  <div className="bg-white rounded-xl shadow-lg p-8 text-center">
    <div className="text-6xl mb-4">🔒</div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">Acesso Restrito</h3>
    <p className="text-gray-600 mb-4">Faça login para ver entregadores disponíveis e suas entregas</p>
    <button 
      onClick={() => setAbaAtiva('login')}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      Fazer Login
    </button>
  </div>
);

function AbaLogistica({ usuario, setAbaAtiva }) {
  const [entregadores, setEntregadores] = useState([]);
  const [entregasAtivas, setEntregasAtivas] = useState([]);
  const [minhasEntregas, setMinhasEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalEntrega, setModalEntrega] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [entregaSelecionada, setEntregaSelecionada] = useState({
    entregadorId: '',
    origem: '',
    destino: '',
    observacoes: ''
  });
  const [novoEntregador, setNovoEntregador] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    veiculo: '',
    placa: '',
    tipo: 'entregador'
  });
  const [abaSelecionada, setAbaSelecionada] = useState('info');

  const provincias = [
    { nome: "Luanda", prazo: "24-48h", parceiro: "Yangue Express" },
    { nome: "Benguela", prazo: "48-72h", parceiro: "Yangue Express" },
    { nome: "Huambo", prazo: "24-48h", parceiro: "Entrega Local" },
    { nome: "Bié", prazo: "24-48h", parceiro: "Entrega Local" },
    { nome: "Outras Províncias", prazo: "3-5 dias", parceiro: "Yangue Express + Parceiros" },
  ];

  const dicas = [
    { icone: "📍", titulo: "Combine com o Vendedor", descricao: "Use o chat para definir o melhor local de encontro" },
    { icone: "📦", titulo: "Verifique o Produto", descricao: "Inspecione antes de finalizar a compra" },
    { icone: "💳", titulo: "Pagamento Seguro", descricao: "Use os métodos de pagamento acordados" },
    { icone: "⭐", titulo: "Avalie a Experiência", descricao: "Sua avaliação ajuda outros compradores" }
  ];

  const isLoggedIn = !!usuario?.id;

  useEffect(() => {
    if (isLoggedIn) {
      carregarDados();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const carregarDados = async () => {
    setLoading(true);
    await Promise.all([
      carregarEntregadores(),
      carregarEntregasAtivas(),
      carregarMinhasEntregas()
    ]);
    setLoading(false);
  };

  const carregarEntregadores = async () => {
    try {
      const response = await axios.get(`${API_URL}/entregadores`);
      setEntregadores(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
      setEntregadores([]);
    }
  };

  const carregarEntregasAtivas = async () => {
    try {
      const response = await axios.get(`${API_URL}/entregas/ativas`);
      setEntregasAtivas(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar entregas ativas:', error);
      setEntregasAtivas([]);
    }
  };

  const carregarMinhasEntregas = async () => {
    if (!usuario?.id) return;
    try {
      let url;
      if (usuario.tipo === 'entregador') {
        url = `${API_URL}/entregas/entregador/${usuario.id}`;
      } else if (usuario.tipo === 'vendedor') {
        url = `${API_URL}/entregas/vendedor/${usuario.id}`;
      } else {
        url = `${API_URL}/entregas/cliente/${usuario.id}`;
      }
      const response = await axios.get(url);
      setMinhasEntregas(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar minhas entregas:', error);
      setMinhasEntregas([]);
    }
  };

  const cadastrarEntregador = async () => {
    if (!novoEntregador.nome || !novoEntregador.email || !novoEntregador.senha) {
      alert('Preencha nome, email e senha');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/cadastro`, {
        ...novoEntregador,
        tipo: 'entregador',
        aceitouContrato: true,
        aceitouTermos: true
      });

      if (response.data) {
        alert(`Entregador ${novoEntregador.nome} cadastrado com sucesso!`);
        setModalCadastro(false);
        setNovoEntregador({ nome: '', email: '', senha: '', telefone: '', veiculo: '', placa: '', tipo: 'entregador' });
        carregarEntregadores();
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      alert(error.response?.data?.msg || 'Erro ao cadastrar entregador');
    } finally {
      setLoading(false);
    }
  };

  const solicitarEntrega = async () => {
    if (!entregaSelecionada.origem || !entregaSelecionada.destino) {
      alert('Preencha origem e destino');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/entregas/solicitar`, {
        clienteId: usuario?.id,
        origem: entregaSelecionada.origem,
        destino: entregaSelecionada.destino,
        entregadorId: entregaSelecionada.entregadorId || null,
        observacoes: entregaSelecionada.observacoes
      });

      if (response.data.success) {
        alert('Entrega solicitada com sucesso!');
        setModalEntrega(false);
        setEntregaSelecionada({ entregadorId: '', origem: '', destino: '', observacoes: '' });
        carregarMinhasEntregas();
        carregarEntregasAtivas();
      }
    } catch (error) {
      console.error('Erro ao solicitar entrega:', error);
      alert('Erro ao solicitar entrega');
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusEntrega = async (entregaId, novoStatus) => {
    try {
      const response = await axios.put(`${API_URL}/entregas/${entregaId}/status`, {
        status: novoStatus
      });
      if (response.data.success) {
        alert(`Status atualizado para: ${novoStatus}`);
        carregarMinhasEntregas();
        carregarEntregasAtivas();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const podeCadastrarEntregador = usuario?.email === 'venanciomartinse@gmail.com' || usuario?.tipo === 'admin';
  const podeVerMinhasEntregas = isLoggedIn && (usuario?.tipo === 'cliente' || usuario?.tipo === 'vendedor' || usuario?.tipo === 'entregador');

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pendente': { cor: 'bg-yellow-100 text-yellow-800', texto: 'Pendente' },
      'aceita': { cor: 'bg-blue-100 text-blue-800', texto: 'Aceita' },
      'retirada': { cor: 'bg-purple-100 text-purple-800', texto: 'Retirada' },
      'entregue': { cor: 'bg-green-100 text-green-800', texto: 'Entregue' },
      'cancelada': { cor: 'bg-red-100 text-red-800', texto: 'Cancelada' }
    };
    return statusConfig[status] || { cor: 'bg-gray-100 text-gray-800', texto: status };
  };

  // Se não estiver logado, mostra mensagem de login
  if (!isLoggedIn) {
    return <LoginMessage setAbaAtiva={setAbaAtiva} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Logistica e Entregas</h2>
            <p className="opacity-90">Sistema integrado de entregas em tempo real</p>
          </div>
          {podeCadastrarEntregador && (
            <button 
              onClick={() => setModalCadastro(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-5 py-2.5 rounded-lg font-semibold transition shadow-md"
            >
              + Cadastrar Entregador
            </button>
          )}
        </div>
      </div>

      {/* Abas de Navegacao */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setAbaSelecionada('disponiveis')}
          className={`px-5 py-2 rounded-t-lg font-semibold transition text-sm ${
            abaSelecionada === 'disponiveis'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Entregadores Disponiveis
        </button>
        {podeVerMinhasEntregas && (
          <button
            onClick={() => setAbaSelecionada('minhas_entregas')}
            className={`px-5 py-2 rounded-t-lg font-semibold transition text-sm ${
              abaSelecionada === 'minhas_entregas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Minhas Entregas
          </button>
        )}
        <button
          onClick={() => setAbaSelecionada('info')}
          className={`px-5 py-2 rounded-t-lg font-semibold transition text-sm ${
            abaSelecionada === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Informacoes
        </button>
      </div>

      {/* ABA: Entregadores Disponiveis */}
      {abaSelecionada === 'disponiveis' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Entregadores Disponiveis</h3>
          {loading ? (
            <LoadingSpinner />
          ) : entregadores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">🚚</p>
              <p>Nenhum entregador cadastrado ainda</p>
              {podeCadastrarEntregador && (
                <button onClick={() => setModalCadastro(true)} className="mt-3 text-blue-600 hover:underline">
                  Clique aqui para cadastrar
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entregadores.map(entregador => (
                <div key={entregador._id} className="border rounded-xl p-4 hover:shadow-lg transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                      🚚
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{entregador.nome}</h4>
                      <p className="text-xs text-gray-500">{entregador.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>📞 {entregador.telefone || 'Nao informado'}</p>
                    <p>🚗 {entregador.veiculo || 'Veiculo nao informado'}</p>
                    <p>🔢 {entregador.placa || 'Sem placa'}</p>
                    <p>📍 {entregador.provincia || 'Nao informada'}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t">
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Disponível
                    </span>
                  </div>
                  {usuario?.tipo === 'cliente' && (
                    <button
                      onClick={() => {
                        setEntregaSelecionada({ ...entregaSelecionada, entregadorId: entregador._id });
                        setModalEntrega(true);
                      }}
                      className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                    >
                      Solicitar Entrega
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA: Minhas Entregas */}
      {abaSelecionada === 'minhas_entregas' && podeVerMinhasEntregas && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Minhas Entregas
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({usuario?.tipo === 'cliente' ? 'Como Comprador' : usuario?.tipo === 'vendedor' ? 'Como Vendedor' : 'Como Entregador'})
            </span>
          </h3>
          {loading ? (
            <LoadingSpinner />
          ) : minhasEntregas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">📦</p>
              <p>Nenhuma entrega encontrada</p>
              {usuario?.tipo === 'cliente' && (
                <button 
                  onClick={() => setAbaSelecionada('disponiveis')}
                  className="mt-3 text-blue-600 hover:underline"
                >
                  Solicitar uma entrega
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {minhasEntregas.map(entrega => {
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
                        <p className="text-sm"><strong>Origem:</strong> {entrega.origem}</p>
                        <p className="text-sm"><strong>Destino:</strong> {entrega.destino}</p>
                        {entrega.observacoes && (
                          <p className="text-sm text-gray-500"><strong>Observacoes:</strong> {entrega.observacoes}</p>
                        )}
                        {entrega.entregadorId && (
                          <p className="text-sm text-blue-600"><strong>Entregador:</strong> {entrega.entregadorId.nome}</p>
                        )}
                        {entrega.clienteId && (usuario?.tipo === 'entregador' || usuario?.tipo === 'vendedor') && (
                          <p className="text-sm text-green-600"><strong>Cliente:</strong> {entrega.clienteId.nome}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModalDetalhes(entrega)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
                        >
                          Detalhes
                        </button>
                        {usuario?.tipo === 'entregador' && entrega.status === 'pendente' && (
                          <button
                            onClick={() => atualizarStatusEntrega(entrega._id, 'aceita')}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                          >
                            Aceitar
                          </button>
                        )}
                        {usuario?.tipo === 'entregador' && entrega.status === 'aceita' && (
                          <button
                            onClick={() => atualizarStatusEntrega(entrega._id, 'retirada')}
                            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
                          >
                            Produto Retirado
                          </button>
                        )}
                        {usuario?.tipo === 'entregador' && entrega.status === 'retirada' && (
                          <button
                            onClick={() => atualizarStatusEntrega(entrega._id, 'entregue')}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                          >
                            Confirmar Entrega
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
      )}

      {/* ABA: Informacoes - Publica */}
      {abaSelecionada === 'info' && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
              <h3 className="text-xl font-bold text-blue-800 mb-3">Modelo de Entrega</h3>
              <p className="text-gray-700">
                O vendedor e o comprador combinam a entrega diretamente pelo chat integrado. 
                Os entregadores cadastrados podem ser acionados para realizar o servico.
              </p>
              {usuario?.tipo === 'cliente' && (
                <button 
                  onClick={() => setAbaSelecionada('disponiveis')}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Ver Entregadores
                </button>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
              <h3 className="text-xl font-bold text-green-800 mb-3">Pontos de Retirada</h3>
              <p className="text-gray-700">
                Pontos fisicos em Luanda, Benguela, Huambo e Kuito para retirada de produtos.
              </p>
              <div className="mt-3 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                Expansao para mais provincias em breve
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <h3 className="text-xl font-bold text-green-700 p-6 pb-0">Prazos Estimados por Provincia</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-green-100">
                  <tr>
                    <th className="py-3 px-6 text-left font-semibold text-green-800">Provincia</th>
                    <th className="py-3 px-6 text-left font-semibold text-green-800">Prazo Estimado</th>
                    <th className="py-3 px-6 text-left font-semibold text-green-800">Parceiro</th>
                  </tr>
                </thead>
                <tbody>
                  {provincias.map((prov, idx) => (
                    <tr key={idx} className="border-b border-green-100 hover:bg-green-50">
                      <td className="py-3 px-6 font-medium">{prov.nome}</td>
                      <td className="py-3 px-6">{prov.prazo}</td>
                      <td className="py-3 px-6">{prov.parceiro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 p-4 text-center">
              *Prazos estimados. Consulte o entregador para confirmacao.
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-xl font-bold text-green-800 mb-4">Dicas para uma Entrega Segura</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {dicas.map((dica, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-4xl mb-2">{dica.icone}</div>
                  <div className="font-semibold text-gray-800">{dica.titulo}</div>
                  <div className="text-sm text-gray-600 mt-1">{dica.descricao}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Precisa de ajuda com a entrega?</h3>
            <p className="text-gray-600 mb-4">Entre em contacto com o nosso suporte</p>
            <button
              onClick={() => window.open('https://wa.me/244928565837')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 inline-flex items-center gap-2 transition"
            >
              Falar com Suporte
            </button>
          </div>
        </>
      )}

      {/* Modais */}
      {modalCadastro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Cadastrar Novo Entregador</h3>
              <button onClick={() => setModalCadastro(false)} className="text-gray-400 hover:text-gray-600">X</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nome completo" className="w-full border p-3 rounded-lg" 
                value={novoEntregador.nome} onChange={(e) => setNovoEntregador({...novoEntregador, nome: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full border p-3 rounded-lg"
                value={novoEntregador.email} onChange={(e) => setNovoEntregador({...novoEntregador, email: e.target.value})} />
              <input type="password" placeholder="Senha" className="w-full border p-3 rounded-lg"
                value={novoEntregador.senha} onChange={(e) => setNovoEntregador({...novoEntregador, senha: e.target.value})} />
              <input type="tel" placeholder="Telefone" className="w-full border p-3 rounded-lg"
                value={novoEntregador.telefone} onChange={(e) => setNovoEntregador({...novoEntregador, telefone: e.target.value})} />
              <input type="text" placeholder="Veiculo" className="w-full border p-3 rounded-lg"
                value={novoEntregador.veiculo} onChange={(e) => setNovoEntregador({...novoEntregador, veiculo: e.target.value})} />
              <input type="text" placeholder="Placa do veiculo" className="w-full border p-3 rounded-lg"
                value={novoEntregador.placa} onChange={(e) => setNovoEntregador({...novoEntregador, placa: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalCadastro(false)} className="flex-1 py-2 bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={cadastrarEntregador} disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Cadastrar</button>
            </div>
          </div>
        </div>
      )}

      {modalEntrega && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Solicitar Entrega</h3>
              <button onClick={() => setModalEntrega(false)} className="text-gray-400 hover:text-gray-600">X</button>
            </div>
            <div className="space-y-3">
              <select className="w-full border p-3 rounded-lg" value={entregaSelecionada.entregadorId} onChange={(e) => setEntregaSelecionada({...entregaSelecionada, entregadorId: e.target.value})}>
                <option value="">Selecione um entregador</option>
                {entregadores.map(e => <option key={e._id} value={e._id}>{e.nome} - {e.veiculo}</option>)}
              </select>
              <input type="text" placeholder="Endereco de origem" className="w-full border p-3 rounded-lg"
                value={entregaSelecionada.origem} onChange={(e) => setEntregaSelecionada({...entregaSelecionada, origem: e.target.value})} />
              <input type="text" placeholder="Endereco de destino" className="w-full border p-3 rounded-lg"
                value={entregaSelecionada.destino} onChange={(e) => setEntregaSelecionada({...entregaSelecionada, destino: e.target.value})} />
              <textarea placeholder="Observacoes adicionais" rows="2" className="w-full border p-3 rounded-lg"
                value={entregaSelecionada.observacoes} onChange={(e) => setEntregaSelecionada({...entregaSelecionada, observacoes: e.target.value})}></textarea>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalEntrega(false)} className="flex-1 py-2 bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={solicitarEntrega} disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Solicitar</button>
            </div>
          </div>
        </div>
      )}

      {modalDetalhes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Detalhes da Entrega</h3>
              <button onClick={() => setModalDetalhes(null)} className="text-gray-400 hover:text-gray-600">X</button>
            </div>
            <div className="space-y-3">
              <p><strong>Status:</strong> {getStatusBadge(modalDetalhes.status).texto}</p>
              <p><strong>Solicitada em:</strong> {new Date(modalDetalhes.createdAt).toLocaleString()}</p>
              <p><strong>Origem:</strong> {modalDetalhes.origem}</p>
              <p><strong>Destino:</strong> {modalDetalhes.destino}</p>
              {modalDetalhes.observacoes && <p><strong>Observacoes:</strong> {modalDetalhes.observacoes}</p>}
              {modalDetalhes.entregadorId && <p><strong>Entregador:</strong> {modalDetalhes.entregadorId.nome}</p>}
            </div>
            <button onClick={() => setModalDetalhes(null)} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AbaLogistica;