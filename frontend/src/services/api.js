// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Serviços de Autenticação
export const authService = {
  login: (email, senha) => api.post('/auth/login', { email, senha }),
  cadastro: (dados) => api.post('/auth/cadastro', dados),
  esqueciSenha: (email) => api.post('/auth/esqueci-senha', { email }),
};

// Serviços de Produtos
export const produtosService = {
  listar: () => api.get('/produtos'),
  buscar: (id) => api.get(`/produtos/${id}`),
  criar: (dados) => api.post('/produtos', dados),
  atualizar: (id, dados) => api.put(`/produtos/${id}`, dados),
  deletar: (id) => api.delete(`/produtos/${id}`),
};

// Serviços de Vendas
export const vendasService = {
  listar: () => api.get('/vendas'),
  criar: (dados) => api.post('/vendas', dados),
  estatisticas: () => api.get('/vendas/estatisticas'),
};

// Serviços de Carrinho
export const carrinhoService = {
  listar: () => api.get('/carrinho'),
  adicionar: (produtoId, quantidade) => api.post('/carrinho', { produtoId, quantidade }),
  remover: (itemId) => api.delete(`/carrinho/${itemId}`),
  checkout: () => api.post('/checkout'),
};

// Serviços de Chat
export const chatService = {
  enviarMensagem: (destinatarioId, conteudo) => 
    api.post('/chat/enviar', { destinatarioId, conteudo }),
  listarConversas: () => api.get('/chat/conversas'),
  buscarMensagens: (usuarioId) => api.get(`/chat/mensagens/${usuarioId}`),
};

// Serviços de Avaliações
export const avaliacaoService = {
  criar: (vendedorId, nota, comentario) => 
    api.post('/avaliacoes', { vendedorId, nota, comentario }),
  listar: (vendedorId) => api.get(`/avaliacoes/vendedor/${vendedorId}`),
};

export default api;