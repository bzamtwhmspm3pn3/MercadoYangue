// src/services/jiamService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const jiamService = {
  // Previsões
  async getDashboard() {
    const response = await axios.get(`${API_URL}/predicoes/dashboard`);
    return response.data;
  },

  async gerarPrevisao(produtoId, provincia = 'Nacional') {
    const response = await axios.post(`${API_URL}/predicoes/gerar`, {
      produtoId,
      provincia,
      periodo: 'semanal'
    });
    return response.data;
  },

  async listarPrevisoes(produtoId = null) {
    const url = produtoId 
      ? `${API_URL}/predicoes/produto/${produtoId}`
      : `${API_URL}/predicoes/listar`;
    const response = await axios.get(url);
    return response.data;
  },

  // Geolocalização
  async iniciarRastreamento(produtoId, vendedorId, localizacao, areaCultivo) {
    const response = await axios.post(`${API_URL}/geolocalizacao/iniciar`, {
      produtoId,
      vendedorId,
      localizacao,
      areaCultivo
    });
    return response.data;
  },

  async atualizarEtapa(rastreamentoId, etapa, localizacao, observacao) {
    const response = await axios.put(`${API_URL}/geolocalizacao/atualizar/${rastreamentoId}`, {
      etapa,
      localizacao,
      observacao
    });
    return response.data;
  },

  async buscarRastreamento(produtoId) {
    const response = await axios.get(`${API_URL}/geolocalizacao/produto/${produtoId}`);
    return response.data;
  },

  async produtoresProximos(lat, lng, raioKm = 50) {
    const response = await axios.get(`${API_URL}/geolocalizacao/produtores-proximos`, {
      params: { lat, lng, raioKm }
    });
    return response.data;
  },

  // Análises
  async analisarDemanda(produtoId) {
    const response = await axios.post(`${API_URL}/r/processamento/analise-demanda`, {
      produtoId
    });
    return response.data;
  },

  async gerarRelatorio(periodo = 'mensal') {
    const response = await axios.post(`${API_URL}/r/processamento/relatorio`, {
      periodo
    });
    return response.data;
  }
};

export default jiamService;