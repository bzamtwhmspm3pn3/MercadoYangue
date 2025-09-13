// src/components/AbaGestaoCompras.jsx
import React, { useEffect, useState } from "react";
import { connectSocket } from "../socket";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

export default function AbaGestaoCompras({ novasCompras }) {
  const [compras, setCompras] = useState([]);
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroDataIni, setFiltroDataIni] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Adiciona compras novas vindas via props
  useEffect(() => {
    if (novasCompras) setCompras((prev) => [novasCompras, ...prev]);
  }, [novasCompras]);

  // Busca compras do backend e conecta socket
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("https://mercadoyangue-i3in.onrender.com/api/compras/minhas", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setCompras(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Erro ao carregar compras:", err);
        setCompras([]);
      });

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const socket = connectSocket(payload.id || payload._id);
      if (!socket) return;

      socket.on("novaCompra", (comp) => setCompras((prev) => [comp, ...prev]));
      socket.on("vendaAtualizada", (v) => {
        setCompras((prev) =>
          prev.map((c) => (c._id === v._id ? { ...c, status: v.status } : c))
        );
      });

      return () => socket.disconnect();
    } catch (err) {
      console.error("Erro ao conectar socket:", err);
    }
  }, []);

  // Aplica filtros
  const comprasFiltradas = compras.filter((c) => {
    const dataCompra = new Date(c.createdAt);
    const vendedorOk = filtroVendedor
      ? (c.vendedor?.nome || c.vendedor)?.toLowerCase().includes(filtroVendedor.toLowerCase())
      : true;
    const produtoOk = filtroProduto
      ? c.produtos?.some((p) =>
          (p.produto?.nome || p.produto || "").toLowerCase().includes(filtroProduto.toLowerCase())
        )
      : true;
    const dataOk =
      (!filtroDataIni || dataCompra >= new Date(filtroDataIni)) &&
      (!filtroDataFim || dataCompra <= new Date(filtroDataFim));
    return vendedorOk && produtoOk && dataOk;
  });

  // Prepara dados para gráficos
  const comprasPorMes = comprasFiltradas.reduce((acc, c) => {
    const mes = new Date(c.createdAt).toLocaleString("pt-AO", {
      month: "short",
      year: "numeric",
    });
    acc[mes] = (acc[mes] || 0) + (c.totalGeral ?? 0);
    return acc;
  }, {});
  const dadosComprasMes = Object.entries(comprasPorMes).map(([mes, total]) => ({
    mes,
    total,
  }));

  // Agrupa produtos
  const produtos = comprasFiltradas.flatMap((c) =>
    (c.produtos || []).map((i) => ({
      nome: i.produto?.nome || i.produto || "Produto desconhecido",
      quantidade: i.quantidade ?? 0,
      preco: i.preco ?? 0,
    }))
  );

  const agrup = produtos.reduce((acc, p) => {
    if (!acc[p.nome]) acc[p.nome] = { quantidade: 0, preco: p.preco };
    acc[p.nome].quantidade += p.quantidade;
    return acc;
  }, {});

  const dadosProdutos = Object.entries(agrup).map(([nome, val]) => ({
    nome,
    quantidade: val.quantidade,
    preco: val.preco,
  }));

  // Gera cores únicas para cada produto
  const cores = [
    "#16a34a", "#2563eb", "#dc2626", "#d97706",
    "#9333ea", "#0d9488", "#f59e0b", "#1d4ed8"
  ];
  const corProduto = (nome) =>
    cores[Math.abs(nome.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % cores.length];

  

// Exportar PDF com cabeçalho e bordas verdes
const exportarPDF = (compras) => {
  const lista = Array.isArray(compras) ? compras : [];

  const doc = new jsPDF();

  // 🔹 Adicionar logo no cabeçalho (troca pelo caminho da tua logo)
  const logo = "/logo.png"; // garante que está no public/
  doc.addImage(logo, "PNG", 14, 8, 20, 20);

  // 🔹 Cabeçalho
  doc.setFontSize(14);
  doc.text("📑 Relatório de Compras", 40, 15);
  doc.setFontSize(10);
  doc.text("Nº Relatório: " + new Date().getTime(), 40, 22);
  doc.text("Cliente: Mercado Yangue", 40, 28);

  // 🔹 Tabela
  const tabela = lista.map((c) => [
    c.vendedor?.nome || "Desconhecido",
    (c.produtos || [])
      .map(
        (p) =>
          `${p.produto?.nome || "??"} (Qtd: ${p.quantidade}, Preço: ${
            p.preco?.toFixed(2) || "0.00"
          } Kz)`
      )
      .join(", "),
    (c.totalGeral ?? 0).toFixed(2) + " Kz",
    c.status || "Confirmada",
    c.createdAt ? new Date(c.createdAt).toLocaleString("pt-AO") : "---",
  ]);

  autoTable(doc, {
    head: [["Vendedor", "Produtos", "Total", "Status", "Data"]],
    body: tabela,
    startY: 35,
    styles: {
      lineColor: [0, 128, 0], // 🔹 verde
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [0, 128, 0], // 🔹 fundo verde
      textColor: [255, 255, 255], // texto branco
    },
  });

  // 🔹 Salvar
  doc.save("relatorio_compras.pdf");
};



  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-md mt-6">
      <h2 className="text-2xl font-bold text-green-700 mb-4">📦 Gestão de Compras</h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Filtrar por vendedor"
          className="border p-2 rounded"
          value={filtroVendedor}
          onChange={(e) => setFiltroVendedor(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filtrar por produto"
          className="border p-2 rounded"
          value={filtroProduto}
          onChange={(e) => setFiltroProduto(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={filtroDataIni}
          onChange={(e) => setFiltroDataIni(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={filtroDataFim}
          onChange={(e) => setFiltroDataFim(e.target.value)}
        />
      </div>

      <button
  onClick={() => exportarPDF(compras)}
  className="px-4 py-2 bg-green-600 text-white rounded-lg mt-4 hover:bg-green-700"
>
  📑 Exportar Relatório PDF
</button>


      {(!comprasFiltradas || comprasFiltradas.length === 0) ? (
        <p className="text-gray-600">Nenhuma compra encontrada.</p>
      ) : (
        <>
          <table className="w-full border mt-2">
            <thead className="bg-green-100">
              <tr>
                <th className="p-2 border">Vendedor</th>
                <th className="p-2 border">Produto</th>
                <th className="p-2 border">Quantidade</th>
                <th className="p-2 border">Preço Unitário</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Data</th>
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.flatMap((c) =>
                (c.produtos || []).map((p, i) => (
                  <tr key={`${c._id}-${i}`} className="hover:bg-gray-100">
                    <td className="p-2 border">{c.vendedor?.nome || c.vendedor || "Desconhecido"}</td>
                    <td className="p-2 border">{p.produto?.nome || p.produto || "Produto desconhecido"}</td>
                    <td className="p-2 border">{p.quantidade ?? 0}</td>
                    <td className="p-2 border">{(p.preco ?? 0).toFixed(2)} Kz</td>
                    <td className="p-2 border">
                      {((p.quantidade ?? 0) * (p.preco ?? 0)).toFixed(2)} Kz
                    </td>
                    <td className="p-2 border">Confirmada</td>

                    <td className="p-2 border">
                      {c.createdAt ? new Date(c.createdAt).toLocaleString("pt-AO") : "---"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Gráficos */}
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
                  {dadosProdutos.map((p) => (
                    <Bar
                      key={p.nome}
                      dataKey="quantidade"
                      fill={corProduto(p.nome)}
                      name={p.nome}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
