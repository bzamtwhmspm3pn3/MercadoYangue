import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jiamAgroService from '../services/jiamAgroService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AbaPrevisoesAgro({ usuario }) {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [analise, setAnalise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [relatorio, setRelatorio] = useState(null);

  const abas = [
    { id: 'resumo', nome: '📊 Resumo Executivo' },
    { id: 'mercado', nome: '📈 Mercado' },
    { id: 'preco', nome: '💰 Preço' },
    { id: 'financeiro', nome: '💵 Financeiro' },
    { id: 'colheita', nome: '🌾 Colheita' },
    { id: 'conservacao', nome: '❄️ Conservação' }
  ];

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const response = await axios.get(`${API_URL}/produtos`);
      setProdutos(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const analisarProduto = async (produtoId) => {
    setLoading(true);
    try {
      const relatorioCompleto = await jiamAgroService.relatorioCompleto(produtoId);
      setRelatorio(relatorioCompleto);
      setAnalise(relatorioCompleto.analises);
    } catch (error) {
      console.error('Erro na análise:', error);
      alert('Erro ao analisar produto. Verifique se há dados de vendas suficientes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarProduto = (produtoId) => {
    const produto = produtos.find(p => p._id === produtoId);
    setProdutoSelecionado(produto);
    analisarProduto(produtoId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🌾</span>
          <h1 className="text-3xl font-bold">JIAM Preditivo - Agronegócio</h1>
        </div>
        <p className="text-green-100">Inteligência de dados para decisões estratégicas no campo angolano</p>
      </div>

      {/* Seleção de Produto */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Selecione um Produto</h2>
        <div className="flex flex-wrap gap-4">
          <select
            onChange={(e) => handleSelecionarProduto(e.target.value)}
            className="flex-1 border rounded-lg p-3 focus:ring-2 focus:ring-green-500"
            defaultValue=""
          >
            <option value="" disabled>Escolha um produto</option>
            {produtos.map(p => (
              <option key={p._id} value={p._id}>{p.nome} - {p.provincia}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="ml-3 text-gray-600">Analisando dados do produto...</p>
        </div>
      )}

      {/* Resultados */}
      {analise && relatorio && (
        <>
          {/* Resumo Executivo */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`p-6 ${
              relatorio.resumo_executivo.saude_geral === 'Excelente' ? 'bg-green-100' :
              relatorio.resumo_executivo.saude_geral === 'Boa' ? 'bg-green-50' :
              relatorio.resumo_executivo.saude_geral === 'Regular' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              <h2 className="text-2xl font-bold mb-2">📋 Resumo Executivo</h2>
              <p className="text-lg mb-2">
                <strong>Produto:</strong> {produtoSelecionado?.nome}
              </p>
              <p className="mb-2">
                <strong>Saúde do Produto:</strong> 
                <span className={`ml-2 font-bold ${
                  relatorio.resumo_executivo.saude_geral === 'Excelente' ? 'text-green-700' :
                  relatorio.resumo_executivo.saude_geral === 'Boa' ? 'text-green-600' :
                  relatorio.resumo_executivo.saude_geral === 'Regular' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {relatorio.resumo_executivo.saude_geral}
                </span>
              </p>
              <p className="mb-2">
                <strong>Recomendação:</strong> {relatorio.resumo_executivo.recomendacao_principal}
              </p>
              <div className="mt-3 p-3 bg-white rounded-lg">
                <strong>🎯 Ações Imediatas:</strong>
                <ul className="list-disc list-inside mt-2">
                  {relatorio.resumo_executivo.acoes_imediatas.map((acao, idx) => (
                    <li key={idx} className="text-gray-700">{acao}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="flex flex-wrap gap-2 border-b pb-2">
            {abas.map(aba => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`px-4 py-2 rounded-lg transition ${
                  abaAtiva === aba.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {aba.nome}
              </button>
            ))}
          </div>

          {/* Conteúdo das Abas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {abaAtiva === 'resumo' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-700">📊 Análise Completa</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Desempenho</h4>
                    <p><strong>Total vendido:</strong> {analise.analise_produto?.desempenho?.total_vendido || 0} un</p>
                    <p><strong>Receita total:</strong> Kz {analise.analise_financeira?.receita?.total_gerado?.toLocaleString() || 0}</p>
                    <p><strong>Margem de lucro:</strong> {analise.analise_financeira?.lucratividade?.margem_lucro || 'N/A'}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Mercado</h4>
                    <p><strong>Tendência:</strong> {analise.tendencias_mercado?.tendencia_geral?.direcao || 'N/A'}</p>
                    <p><strong>Top província:</strong> {analise.mapa_procura?.top_provincias?.[0]?.nome || 'N/A'}</p>
                    <p><strong>Melhor época:</strong> {analise.previsao_sazonal?.alta_temporada?.[0]?.mes || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'mercado' && analise.previsao_mercado && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-700">📈 Análise de Mercado</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Demanda</h4>
                    <p><strong>Demanda mensal:</strong> {analise.previsao_mercado?.previsao?.demanda_mensal_estimada || 0} un</p>
                    <p><strong>Projeção anual:</strong> {analise.previsao_mercado?.previsao?.projecao_anual || 0} un</p>
                    <p><strong>Tendência:</strong> {analise.previsao_mercado?.previsao?.tendencia || 'N/A'}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Top Regiões</h4>
                    {analise.mapa_procura?.top_provincias?.slice(0, 3).map((p, idx) => (
                      <p key={idx}><strong>{p.nome}:</strong> {p.vendas} vendas</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'preco' && analise.preco_ideal && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-700">💰 Análise de Preço</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <p><strong>Preço atual:</strong> Kz {analise.preco_ideal?.preco_atual?.toLocaleString()}</p>
                    <p><strong>Preço médio mercado:</strong> Kz {analise.preco_ideal?.preco_medio_mercado?.toLocaleString()}</p>
                    <p><strong>Preço ideal sugerido:</strong> <span className="text-green-700 font-bold">Kz {analise.preco_ideal?.preco_ideal_sugerido?.toLocaleString()}</span></p>
                    <p className="mt-2 text-yellow-700">{analise.preco_ideal?.recomendacao}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Preço por Região</h4>
                    {Object.entries(analise.preco_ideal?.precos_por_regiao || {}).slice(0, 3).map(([regiao, preco]) => (
                      <p key={regiao}><strong>{regiao}:</strong> Kz {preco?.toLocaleString()}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'financeiro' && analise.analise_financeira && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-700">💵 Análise Financeira</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Receita</h4>
                    <p><strong>Total:</strong> Kz {analise.analise_financeira?.receita?.total_gerado?.toLocaleString()}</p>
                    <p><strong>Quantidade:</strong> {analise.analise_financeira?.receita?.quantidade_vendida || 0} un</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Lucratividade</h4>
                    <p><strong>Lucro unitário:</strong> Kz {analise.analise_financeira?.lucratividade?.lucro_unitario?.toLocaleString()}</p>
                    <p><strong>Margem:</strong> {analise.analise_financeira?.lucratividade?.margem_lucro}</p>
                    <p><strong>ROI:</strong> {analise.analise_financeira?.lucratividade?.roi_estimado}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Custos</h4>
                    <p><strong>Produção:</strong> Kz {analise.analise_financeira?.custos?.producao_unitario?.toLocaleString()}</p>
                    <p><strong>Transporte:</strong> Kz {analise.analise_financeira?.custos?.transporte_unitario?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'colheita' && analise.planejamento_colheita && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-700">🌾 Planejamento de Colheita</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Estoque</h4>
                    <p><strong>Atual:</strong> {analise.planejamento_colheita?.analise_colheita?.estoque_atual}</p>
                    <p><strong>Autonomia:</strong> {analise.planejamento_colheita?.analise_colheita?.autonomia_estoque_dias} dias</p>
                    <p className="text-yellow-700 mt-2">{analise.planejamento_colheita?.planejamento?.acao_recomendada}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Sazonalidade</h4>
                    <p><strong>Melhor mês:</strong> {analise.planejamento_colheita?.analise_colheita?.meses_maior_demanda?.[0]?.mes}</p>
                    <p><strong>Próximo plantio:</strong> {analise.planejamento_colheita?.planejamento?.periodo_plantio_sugerido}</p>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'conservacao' && analise.estrategia_conservacao && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-700">❄️ Estratégia de Conservação</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Condições Ideais</h4>
                    <p><strong>Temperatura:</strong> {analise.estrategia_conservacao?.conservacao?.temperatura}</p>
                    <p><strong>Umidade:</strong> {analise.estrategia_conservacao?.conservacao?.umidade}</p>
                    <p><strong>Método:</strong> {analise.estrategia_conservacao?.conservacao?.metodo}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">Benefícios</h4>
                    <p><strong>Perdas sem conservação:</strong> {analise.estrategia_conservacao?.perdas_estimadas_sem_conservacao}</p>
                    <p><strong>Perdas com conservação:</strong> {analise.estrategia_conservacao?.perdas_estimadas_com_conservacao}</p>
                    <p><strong>Economia potencial:</strong> {analise.estrategia_conservacao?.economia_potencial}</p>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 mt-2">
                  <h4 className="font-bold mb-2">💡 Dicas de Conservação</h4>
                  <ul className="list-disc list-inside">
                    {analise.estrategia_conservacao?.conservacao?.dicas?.map((dica, idx) => (
                      <li key={idx}>{dica}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!analise && !loading && produtos.length > 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <p className="text-gray-500">Selecione um produto para iniciar a análise</p>
        </div>
      )}
    </div>
  );
}

export default AbaPrevisoesAgro;