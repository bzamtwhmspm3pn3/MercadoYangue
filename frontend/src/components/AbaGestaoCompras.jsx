// src/components/AbaGestaoCompras.jsx
import React, { useEffect, useState } from "react";
import { connectSocket } from '../socket';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AbaGestaoCompras({ novasCompras }) {
  const [compras, setCompras] = useState([]);

  useEffect(() => {
    if (novasCompras) setCompras(prev => [novasCompras, ...prev]);
  }, [novasCompras]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${process.env.REACT_APP_API_URL}/api/compras/minhas`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => setCompras(Array.isArray(data) ? data : []))
      .catch(err => { 
        console.error('Erro compras', err); 
        setCompras([]); 
      });

    // socket
    const payload = JSON.parse(atob(token.split('.')[1])); // extrai payload do JWT
    const socket = connectSocket(payload.id || payload._id);
    if (!socket) return;
    socket.on('novaCompra', (comp) => setCompras(prev => [comp, ...prev]));
    socket.on('vendaAtualizada', (v) => {
      setCompras(prev => prev.map(c => c._id === v._id ? { ...c, status: v.status } : c));
    });
    return () => socket.disconnect();
  }, []);

  // prepara gráficos...
  const comprasPorMes = compras.reduce((acc, c) => {
    const mes = new Date(c.createdAt || c.criadoEm).toLocaleString('pt-AO', { month: 'short', year: 'numeric' });
    acc[mes] = (acc[mes] || 0) + (c.total || 0);
    return acc;
  }, {});
  const dadosComprasMes = Object.entries(comprasPorMes).map(([mes, total]) => ({ mes, total }));
  const produtos = compras.flatMap(c => (c.itens || []).map(i => ({ nome: i.produto, quantidade: i.quantidade })));
  const agrup = produtos.reduce((acc, p) => { acc[p.nome] = (acc[p.nome] || 0) + p.quantidade; return acc; }, {});
  const dadosProdutos = Object.entries(agrup).map(([nome, quantidade]) => ({ nome, quantidade }));

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-md mt-6">
      <h2 className="text-2xl font-bold text-green-700 mb-4">📦 Gestão de Compras</h2>

      {(!compras || compras.length === 0) ? (
        <p className="text-gray-600">Nenhuma compra registrada.</p>
      ) : (
        <>
          <table className="w-full border mt-2">
            <thead className="bg-green-100">
              <tr>
                <th className="p-2 border">Vendedor</th>
                <th className="p-2 border">Produtos</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Data</th>
              </tr>
            </thead>
            <tbody>
              {compras.map(c => (
                <tr key={c._id} className="hover:bg-gray-100">
                  <td className="p-2 border">{(c.vendedorId && (c.vendedorId.nome || c.vendedorId)) || 'Desconhecido'}</td>
                  <td className="p-2 border">{(c.itens || []).map((p,i) => <span key={i}>{p.produto} ({p.quantidade}){i < c.itens.length-1 ? ', ' : ''}</span>)}</td>
                  <td className="p-2 border">{((c.total ?? 0)).toFixed(2)} Kz</td>
                  <td className="p-2 border">{c.status}</td>
                  <td className="p-2 border">{new Date(c.createdAt || c.criadoEm).toLocaleString('pt-AO')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-4 bg-gray-50 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold mb-3 text-center">📊 Compras por Mês</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosComprasMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold mb-3 text-center">🥇 Produtos Mais Comprados</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosProdutos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantidade" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
