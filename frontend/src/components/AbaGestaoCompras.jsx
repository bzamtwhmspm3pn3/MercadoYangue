// src/components/AbaGestaoCompras.jsx
import React, { useEffect, useState } from "react";
import { connectSocket } from "../socket";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
LabelList,
  Legend
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

export default function AbaGestaoCompras({ novasCompras, usuario }) {
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

    fetch("https://mercadoyangue.netlify.app/api/compras/minhas", {
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

// 🔹 Exportar PDF com cabeçalho completo, totais globais e resumo por produto
const exportarPDF = async (compras, usuario) => {
  const lista = Array.isArray(compras) ? compras : [];
  const doc = new jsPDF();

 
  // 🔹 Logo (Base64)
  const loadImageAsBase64 = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });

  const logoBase64 = await loadImageAsBase64("/logo-mercado-yangue.png");
  doc.addImage(logoBase64, "PNG", 14, 8, 25, 25);

  // 🔹 Cabeçalho
  const dataAtual = new Date();
  const dataFormatada = dataAtual.toISOString().slice(0, 10).replace(/-/g, "");
  const numeroRelatorio = `${dataFormatada}-${String(
    Math.floor(Math.random() * 999) + 1
  ).padStart(3, "0")}`;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 128, 0);
  doc.text("Relatório de Compras", 50, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text("Nº Relatório: " + numeroRelatorio, 50, 28);
  doc.text("Cliente: " + (usuario?.nome || "N/A"), 50, 36);
  doc.text("Emitido em: " + dataAtual.toLocaleString("pt-AO"), 50, 44);

  // 🔹 Tabela principal
  const tabela = lista.map((c) => [
    c.vendedor?.nome || "Desconhecido",
    (c.produtos || [])
      .map(
        (p) =>
          `${p.produto?.nome || "??"} (Qtd: ${p.quantidade}, Preço: ${formatarKz(
            p.preco || 0
          )})`
      )
      .join(", "),
    formatarKz(c.totalGeral ?? 0),
    c.status || "Confirmada",
    c.createdAt ? new Date(c.createdAt).toLocaleString("pt-AO") : "---",
  ]);

  autoTable(doc, {
    head: [["Vendedor", "Produtos", "Total", "Status", "Data"]],
    body: tabela,
    startY: 55,
    styles: { lineColor: [0, 128, 0], lineWidth: 0.5 },
    headStyles: {
      fillColor: [0, 128, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [240, 255, 240] },
    bodyStyles: { fontSize: 9 },
  });

  // 🔹 Total Global
  const totalGlobal = lista.reduce((acc, c) => acc + (c.totalGeral ?? 0), 0);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    body: [["Total Global de Compras", formatarKz(totalGlobal)]],
    theme: "grid",
    bodyStyles: {
      fontSize: 11,
      fontStyle: "bold",
      halign: "center",
      textColor: [0, 128, 0],
    },
  });

  // 🔹 Resumo por Produto
  const produtosResumo = {};
  lista.forEach((c) => {
    (c.produtos || []).forEach((p) => {
      const nome = p.produto?.nome || "??";
      if (!produtosResumo[nome]) {
        produtosResumo[nome] = {
          quantidade: 0,
          total: 0,
          vendedores: new Set(),
        };
      }
      produtosResumo[nome].quantidade += p.quantidade;
      produtosResumo[nome].total += (p.preco || 0) * p.quantidade;
      if (c.vendedor?.nome) produtosResumo[nome].vendedores.add(c.vendedor.nome);
    });
  });

  const tabelaResumo = Object.entries(produtosResumo).map(
    ([nome, info], i) => [
      i + 1,
      nome,
      info.quantidade,
      info.vendedores.size > 0
        ? Array.from(info.vendedores).join(", ")
        : "—",
      formatarKz(info.total),
    ]
  );

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [["#", "Produto", "Qtd Total", "Vendedores", "Total (AOA)"]],
    body: tabelaResumo,
    theme: "grid",
    headStyles: { fillColor: [0, 128, 0], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [242, 242, 242] },
    bodyStyles: { fontSize: 10, halign: "center" },
  });

  // 🔹 Rodapé
  const paginaAltura = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.text(
    `Sistema MercadoYangue - Relatório validado automaticamente.`,
    14,
    paginaAltura - 10
  );

  // 🔹 Salvar
  doc.save(`relatorio_compras_${numeroRelatorio}.pdf`);
};



// Função para formatar valores em Kz
const formatarKz = (valor) => {
  return new Intl.NumberFormat("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor) + " Kz"; // força Kz
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
      onClick={() => exportarPDF(compras, usuario)}
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
                  <td className="p-2 border">{formatarKz(p.preco ?? 0)}</td>
                  <td className="p-2 border">{formatarKz((p.quantidade ?? 0) * (p.preco ?? 0))}</td>
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
  {/* 📊 Compras por Mês */}
  <div className="p-4 bg-gray-50 rounded-xl shadow-md">
    <h3 className="text-lg font-semibold mb-3 text-center">📊 Compras por Mês</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={dadosComprasMes}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#4a5568" }} />
        <YAxis tick={{ fontSize: 12, fill: "#4a5568" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          formatter={(value) =>
            value.toLocaleString("pt-AO", { style: "currency", currency: "AOA" })
          }
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2, fill: "#16a34a" }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

  {/* 🥇 Produtos Mais Comprados */}
  <div className="p-4 bg-gray-50 rounded-xl shadow-md">
    <h3 className="text-lg font-semibold mb-3 text-center">🥇 Produtos Mais Comprados</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={dadosProdutos}
        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="nome"
          tick={{ fontSize: 12, fill: "#4a5568" }}
          interval={0}
        />
        <YAxis tick={{ fontSize: 12, fill: "#4a5568" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          formatter={(value) => value.toLocaleString()}
        />
        <Bar dataKey="quantidade" radius={[6, 6, 0, 0]}>
  {dadosProdutos.map((p) => (
    <Cell
      key={p.nome}
      fill={corProduto(p.nome)}
      stroke="#fff"
      strokeWidth={1}
      style={{ filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.15))" }}
    />
  ))}
  <LabelList
    dataKey="quantidade"
    position="insideTop" // dentro da barra, próximo ao topo
    offset={-4} // ajuste de espaço
    formatter={(val) => val}
    style={{
      fill: "#000",       // ✅ texto preto
      fontSize: 12,
      fontWeight: 600,
      textShadow: "none"  // remove sombra para deixar limpo
    }}
  />
</Bar>

      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
        </>
      )}
    </div>
  );
}
