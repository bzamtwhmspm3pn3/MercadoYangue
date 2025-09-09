import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AbaGestaoCompras({ novasCompras }) {
  const [compras, setCompras] = useState([]);

  // Atualiza lista instantaneamente ao receber nova compra
  useEffect(() => {
    if (novasCompras) {
      setCompras((prev) => [novasCompras, ...prev]);
    }
  }, [novasCompras]);

  // Fetch inicial do backend
  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/compras", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar compras");
        const data = await res.json();
        setCompras(data);
      } catch (err) {
        console.error("Erro no fetch de compras:", err);
      }
    };
    fetchCompras();
  }, []);

  // Formatter de moeda
  const formatarKz = (val) =>
    new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 2,
    }).format(val || 0);

  // --- Preparar dados para gráficos ---
  const comprasPorMes = compras.reduce((acc, c) => {
    const mes = new Date(c.createdAt).toLocaleString("pt-AO", {
      month: "short",
      year: "numeric",
    });
    acc[mes] = (acc[mes] || 0) + (c.total || 0);
    return acc;
  }, {});
  const dadosComprasMes = Object.entries(comprasPorMes).map(([mes, total]) => ({
    mes,
    total,
  }));

  const produtosMaisComprados = compras.flatMap((c) =>
    c.itens.map((p) => ({
      nome: p.produto?.nome || p.produto,
      quantidade: p.quantidade,
    }))
  );
  const produtosAgrupados = produtosMaisComprados.reduce((acc, p) => {
    acc[p.nome] = (acc[p.nome] || 0) + p.quantidade;
    return acc;
  }, {});
  const dadosProdutos = Object.entries(produtosAgrupados).map(
    ([nome, quantidade]) => ({
      nome,
      quantidade,
    })
  );

  const renderStatus = (status) => {
    const cores = {
      pendente: "text-yellow-700 bg-yellow-100",
      confirmada: "text-green-700 bg-green-100",
      cancelada: "text-red-700 bg-red-100",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-sm font-semibold ${
          cores[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-md mt-6">
      <h2 className="text-2xl font-bold text-green-700 mb-4">
        📦 Gestão de Compras
      </h2>

      {compras.length === 0 ? (
        <p className="text-gray-600">Nenhuma compra registada.</p>
      ) : (
        <>
          {/* Tabela de Compras */}
          <div className="overflow-x-auto">
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
                {compras.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    {/* Vendedor */}
                    <td className="p-2 border">
                      {c.vendedorId?.nome || c.vendedorId || "Desconhecido"}
                    </td>

                    {/* Produtos */}
                    <td className="p-2 border">
                      {c.itens.map((p, i) => (
                        <span key={i}>
                          {p.produto?.nome || p.produto} ({p.quantidade})
                          {i < c.itens.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </td>

                    {/* Total */}
                    <td className="p-2 border">{formatarKz(c.total)}</td>

                    {/* Status */}
                    <td className="p-2 border">{renderStatus(c.status)}</td>

                    {/* Data */}
                    <td className="p-2 border">
                      {new Date(c.createdAt).toLocaleString("pt-AO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-4 bg-gray-50 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold mb-3 text-center">
                📊 Compras por Mês
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosComprasMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#16a34a"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold mb-3 text-center">
                🥇 Produtos Mais Comprados
              </h3>
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
