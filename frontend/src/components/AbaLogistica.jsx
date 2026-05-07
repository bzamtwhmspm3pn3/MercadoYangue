import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AbaLogistica({ usuario }) {
  const [entregadores, setEntregadores] = useState([]);
  const [entregasAtivas, setEntregasAtivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalEntrega, setModalEntrega] = useState(false);
  const [entregaSelecionada, setEntregaSelecionada] = useState(null);
  const [novoEntregador, setNovoEntregador] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    veiculo: '',
    placa: '',
    tipo: 'entregador'
  });

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
    { icone: "💳", titulo: "Pagamento Seguro", descricao: "Use os métodos de pagamento acordados na plataforma" },
    { icone: "⭐", titulo: "Avalie a Experiência", descricao: "Sua avaliação ajuda outros compradores" }
  ];

  // Carregar entregadores e entregas
  useEffect(() => {
    carregarEntregadores();
    carregarEntregas();
  }, []);

  const carregarEntregadores = async () => {
    try {
      const response = await axios.get(`${API_URL}/entregadores`);
      setEntregadores(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEntregas = async () => {
    try {
      const response = await axios.get(`${API_URL}/entregas`);
      setEntregasAtivas(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
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
        aceitouContrato: true
      });

      if (response.data) {
        alert(`✅ Entregador ${novoEntregador.nome} cadastrado com sucesso!`);
        setModalCadastro(false);
        setNovoEntregador({ nome: '', email: '', senha: '', telefone: '', veiculo: '', placa: '', tipo: 'entregador' });
        carregarEntregadores();
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      alert('Erro ao cadastrar entregador. Verifique se o email já existe.');
    } finally {
      setLoading(false);
    }
  };

  const solicitarEntrega = async () => {
    if (!entregaSelecionada) return;

    try {
      const response = await axios.post(`${API_URL}/entregas/solicitar`, {
        ...entregaSelecionada,
        clienteId: usuario?.id,
        status: 'pendente'
      });

      if (response.data) {
        alert('✅ Entrega solicitada! Um entregador será designado em breve.');
        setModalEntrega(false);
        carregarEntregas();
      }
    } catch (error) {
      console.error('Erro ao solicitar entrega:', error);
      alert('Erro ao solicitar entrega');
    }
  };

  const podeCadastrarEntregador = usuario?.email === 'venanciomartinse@gmail.com' || usuario?.tipo === 'admin';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">🚚 Logística e Entregas</h2>
            <p className="opacity-90">Sistema integrado de entregas em tempo real</p>
          </div>
          {podeCadastrarEntregador && (
            <button 
              onClick={() => setModalCadastro(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-semibold transition"
            >
              + Cadastrar Entregador
            </button>
          )}
        </div>
      </div>

      {/* Entregadores Disponíveis */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">👨‍✈️</span> Entregadores Disponíveis
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
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
              <div key={entregador._id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                    🚚
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{entregador.nome}</h4>
                    <p className="text-xs text-gray-500">{entregador.email}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2"><span className="text-gray-500">📞</span> {entregador.telefone || 'Não informado'}</p>
                  <p className="flex items-center gap-2"><span className="text-gray-500">🚗</span> {entregador.veiculo || 'Veículo não informado'}</p>
                  <p className="flex items-center gap-2"><span className="text-gray-500">🔢</span> {entregador.placa || 'Sem placa'}</p>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Disponível
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modelos de Entrega e Pontos de Retirada */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
          <h3 className="text-xl font-bold text-blue-800 mb-3">🚚 Modelo de Entrega</h3>
          <p className="text-gray-700">
            O vendedor e o comprador combinam a entrega diretamente pelo <strong>chat integrado</strong>. 
            Os entregadores cadastrados podem ser acionados para realizar o serviço.
          </p>
          {usuario?.tipo === 'cliente' && (
            <button 
              onClick={() => setModalEntrega(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Solicitar Entrega
            </button>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
          <h3 className="text-xl font-bold text-green-800 mb-3">📍 Pontos de Retirada</h3>
          <p className="text-gray-700">
            Pontos físicos em <strong>Luanda, Benguela, Huambo e Kuito</strong> para retirada de produtos.
          </p>
          <div className="mt-3 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
            🚀 Em breve: Expansão para mais províncias
          </div>
        </div>
      </div>

      {/* Tabela de Prazos */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <h3 className="text-xl font-bold text-green-700 p-6 pb-0">📅 Prazos Estimados por Província</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-green-100">
              <tr>
                <th className="py-3 px-6 text-left font-semibold text-green-800">Província</th>
                <th className="py-3 px-6 text-left font-semibold text-green-800">Prazo Estimado</th>
                <th className="py-3 px-6 text-left font-semibold text-green-800">Parceiro de Entrega</th>
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
          *Prazos estimados. Consulte o entregador para confirmação.
        </p>
      </div>

      {/* Dicas */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <h3 className="text-xl font-bold text-green-800 mb-4">💡 Dicas para uma Entrega Segura</h3>
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

      {/* Suporte */}
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Precisa de ajuda com a entrega?</h3>
        <p className="text-gray-600 mb-4">Entre em contacto com o nosso suporte</p>
        <button
          onClick={() => window.open('https://wa.me/244923000000')}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 inline-flex items-center gap-2 transition"
        >
          📱 Falar com Suporte
        </button>
      </div>

      {/* Modal Cadastro Entregador */}
      {modalCadastro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">➕ Cadastrar Novo Entregador</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nome completo" className="w-full border p-3 rounded-lg" 
                value={novoEntregador.nome} onChange={(e) => setNovoEntregador({...novoEntregador, nome: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full border p-3 rounded-lg"
                value={novoEntregador.email} onChange={(e) => setNovoEntregador({...novoEntregador, email: e.target.value})} />
              <input type="password" placeholder="Senha" className="w-full border p-3 rounded-lg"
                value={novoEntregador.senha} onChange={(e) => setNovoEntregador({...novoEntregador, senha: e.target.value})} />
              <input type="tel" placeholder="Telefone" className="w-full border p-3 rounded-lg"
                value={novoEntregador.telefone} onChange={(e) => setNovoEntregador({...novoEntregador, telefone: e.target.value})} />
              <input type="text" placeholder="Veículo (Ex: Toyota Hilux)" className="w-full border p-3 rounded-lg"
                value={novoEntregador.veiculo} onChange={(e) => setNovoEntregador({...novoEntregador, veiculo: e.target.value})} />
              <input type="text" placeholder="Placa do veículo" className="w-full border p-3 rounded-lg"
                value={novoEntregador.placa} onChange={(e) => setNovoEntregador({...novoEntregador, placa: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalCadastro(false)} className="flex-1 py-2 bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={cadastrarEntregador} disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Cadastrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Solicitar Entrega */}
      {modalEntrega && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🚚 Solicitar Entrega</h3>
            <div className="space-y-3">
              <select className="w-full border p-3 rounded-lg" onChange={(e) => setEntregaSelecionada({...entregaSelecionada, entregadorId: e.target.value})}>
                <option value="">Selecione um entregador</option>
                {entregadores.map(e => <option key={e._id} value={e._id}>{e.nome} - {e.veiculo}</option>)}
              </select>
              <input type="text" placeholder="Endereço de origem" className="w-full border p-3 rounded-lg"
                onChange={(e) => setEntregaSelecionada({...entregaSelecionada, origem: e.target.value})} />
              <input type="text" placeholder="Endereço de destino" className="w-full border p-3 rounded-lg"
                onChange={(e) => setEntregaSelecionada({...entregaSelecionada, destino: e.target.value})} />
              <textarea placeholder="Observações adicionais" rows="2" className="w-full border p-3 rounded-lg"
                onChange={(e) => setEntregaSelecionada({...entregaSelecionada, observacoes: e.target.value})}></textarea>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalEntrega(false)} className="flex-1 py-2 bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={solicitarEntrega} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Solicitar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AbaLogistica;