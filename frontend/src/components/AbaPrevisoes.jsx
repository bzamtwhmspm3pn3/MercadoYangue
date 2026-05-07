import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AbaPrevisoes({ usuario }) {
  const [previsoes, setPrevisoes] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [gerandoPrevisao, setGerandoPrevisao] = useState(false);

  useEffect(() => {
    carregarDados();
    carregarProdutos();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [dashboardRes, previsoesRes] = await Promise.all([
        axios.get(`${API_URL}/predicoes/dashboard`),
        axios.get(`${API_URL}/predicoes/listar`)
      ]);
      setDashboard(dashboardRes.data.data);
      setPrevisoes(previsoesRes.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar previsões:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarProdutos = async () => {
    try {
      const response = await axios.get(`${API_URL}/produtos`);
      setProdutos(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const gerarPrevisao = async () => {
    if (!produtoSelecionado) {
      alert('Selecione um produto');
      return;
    }

    setGerandoPrevisao(true);
    try {
      const response = await axios.post(`${API_URL}/predicoes/gerar`, {
        produtoId: produtoSelecionado,
        provincia: 'Nacional',
        periodo: 'semanal'
      });
      
      if (response.data.success) {
        alert('Previsão gerada com sucesso!');
        carregarDados();
      } else {
        alert(response.data.message || 'Erro ao gerar previsão');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar previsão. Dados insuficientes?');
    } finally {
      setGerandoPrevisao(false);
    }
  };

  const dadosGrafico = {
    labels: previsoes.slice(0, 7).map(p => new Date(p.createdAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Demanda Estimada (kg)',
        data: previsoes.slice(0, 7).map(p => p.demandaEstimada),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Preço Estimado (Kz)',
        data: previsoes.slice(0, 7).map(p => p.precoEstimado),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
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
        <h2 className="text-2xl font-bold mb-2">📊 JIAM Preditivo</h2>
        <p className="opacity-90">Inteligência de dados e previsão de procura para apoio à decisão agrícola</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">Previsões Geradas</div>
          <div className="text-3xl font-bold text-green-700">{dashboard?.totalPrevisoes || 0}</div>
          <div className="text-xs text-gray-400 mt-2">Total no sistema</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm">Confiança Média</div>
          <div className="text-3xl font-bold text-blue-700">{Math.round(dashboard?.confiancaMedia || 0)}%</div>
          <div className="text-xs text-gray-400 mt-2">Precisão das previsões</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="text-gray-500 text-sm">Produtos com Previsão</div>
          <div className="text-3xl font-bold text-yellow-700">{dashboard?.topProdutos?.length || 0}</div>
          <div className="text-xs text-gray-400 mt-2">Em análise ativa</div>
        </div>
      </div>

      {/* Gráfico */}
      {previsoes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Tendência de Demanda e Preços</h3>
          <Line data={dadosGrafico} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>
      )}

      {/* Gerar Nova Previsão */}
      {(usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor') && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🔮 Gerar Nova Previsão</h3>
          <div className="flex gap-4 flex-wrap">
            <select
              value={produtoSelecionado}
              onChange={(e) => setProdutoSelecionado(e.target.value)}
              className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione um produto</option>
              {produtos.map(p => (
                <option key={p._id} value={p._id}>{p.nome}</option>
              ))}
            </select>
            <button
              onClick={gerarPrevisao}
              disabled={gerandoPrevisao}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {gerandoPrevisao ? 'Gerando...' : 'Gerar Previsão'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            * O sistema analisa os últimos 90 dias de vendas para gerar previsões precisas
          </p>
        </div>
      )}

      {/* Top Produtos */}
      {dashboard?.topProdutos?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Top Produtos com Maior Demanda</h3>
          <div className="space-y-3">
            {dashboard.topProdutos.map((prod, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                  <div>
                    <div className="font-semibold">{prod.produtoId?.nome || 'Produto'}</div>
                    <div className="text-xs text-gray-500">Confiança: {prod.ultimaPrevisao?.confianca || 0}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-700">{prod.ultimaPrevisao?.demandaEstimada || 0} kg</div>
                  <div className="text-xs text-gray-500">Demanda prevista</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-bold text-green-800 mb-3">💡 Insights JIAM</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600">📊</span>
            <span>Baseado em dados históricos de vendas e tendências sazonais</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">🎯</span>
            <span>Confiança acima de 70% indica alta precisão na previsão</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">🔄</span>
            <span>Atualize suas vendas regularmente para melhorar as previsões</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AbaPrevisoes;