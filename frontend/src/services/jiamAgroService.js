// src/services/jiamAgroService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const jiamAgroService = {
  // ========== ANÁLISE DE PRODUTO ==========
  async analisarProduto(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/analise-produto/${produtoId}`);
    return response.data;
  },

  // ========== PREVISÃO DE MERCADO ==========
  async previsaoMercado(produtoId, provincia = null) {
    const response = await axios.post(`${API_URL}/jiam/previsao-mercado`, {
      produtoId,
      provincia
    });
    return response.data;
  },

  // ========== ONDE TEM MAIS PROCURA ==========
  async mapaProcura(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/mapa-procura/${produtoId}`);
    return response.data;
  },

  // ========== PREÇO IDEAL POR REGIÃO ==========
  async precoIdeal(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/preco-ideal/${produtoId}`);
    return response.data;
  },

  // ========== TEMPO MÉDIO DE CONVERSÃO ==========
  async tempoConversao(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/tempo-conversao/${produtoId}`);
    return response.data;
  },

  // ========== ESTRATÉGIA DE CONSERVAÇÃO ==========
  async estrategiaConservacao(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/estrategia-conservacao/${produtoId}`);
    return response.data;
  },

  // ========== PLANEJAMENTO DE COLHEITA ==========
  async planejamentoColheita(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/planejamento-colheita/${produtoId}`);
    return response.data;
  },

  // ========== ANÁLISE FINANCEIRA ==========
  async analiseFinanceira(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/analise-financeira/${produtoId}`);
    return response.data;
  },

  // ========== TENDÊNCIAS DE MERCADO ==========
  async tendenciasMercado(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/tendencias/${produtoId}`);
    return response.data;
  },

  // ========== RELATÓRIO COMPLETO DO PRODUTO ==========
  async relatorioCompleto(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/relatorio-completo/${produtoId}`);
    return response.data;
  },

  // ========== PREVISÃO SAZONAL ==========
  async previsaoSazonal(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/previsao-sazonal/${produtoId}`);
    return response.data;
  },

  // ========== COMPETITIVIDADE ==========
  async competitividade(produtoId) {
    const response = await axios.get(`${API_URL}/jiam/competitividade/${produtoId}`);
    return response.data;
  }
};

export default jiamAgroService;