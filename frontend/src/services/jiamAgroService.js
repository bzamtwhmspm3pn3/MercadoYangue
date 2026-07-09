import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const jiamAgroService = {
  async analisarProduto(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/analise-produto/${produtoId}`);
    return response.data;
  },

  async previsaoMercado(produtoId, periodo) {
    const response = await axios.post(`${API_URL}/jiam/previsao-mercado`, { produtoId, periodo });
    return response.data;
  },

  async mapaProcura(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/mapa-procura/${produtoId}`);
    return response.data;
  },

  async precoIdeal(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/preco-ideal/${produtoId}`);
    return response.data;
  },

  async tempoConversao(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/tempo-conversao/${produtoId}`);
    return response.data;
  },

  async estrategiaConservacao(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/estrategia-conservacao/${produtoId}`);
    return response.data;
  },

  async planejamentoColheita(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/planejamento-colheita/${produtoId}`);
    return response.data;
  },

  async analiseFinanceira(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/analise-financeira/${produtoId}`);
    return response.data;
  },

  async tendenciasMercado(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/tendencias/${produtoId}`);
    return response.data;
  },

  async relatorioCompleto(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/relatorio-completo/${produtoId}`);
    return response.data;
  },

  async previsaoSazonal(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/previsao-sazonal/${produtoId}`);
    return response.data;
  },

  async competitividade(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/competitividade/${produtoId}`);
    return response.data;
  },
};

export default jiamAgroService;
