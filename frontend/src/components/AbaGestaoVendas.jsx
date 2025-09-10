import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell
} from "recharts";

const cores = ["#38a169", "#2b6cb0", "#d69e2e", "#9f7aea", "#ed8936"];

const AbaGestaoVendas = ({ usuario }) => {
  const [produtos, setProdutos] = useState([]);
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [vendasConfirmadas, setVendasConfirmadas] = useState([]);
  const refImpressao = useRef();

  // 🔹 Buscar produtos e vendas
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const carregarProdutos = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/produtos/meus-produtos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar produtos");
        const dados = await res.json();
        setProdutos(Array.isArray(dados) ? dados : []);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        setProdutos([]);
      }
    };

    const carregarVendas = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/vendas/confirmadas", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar vendas confirmadas");
        const dados = await res.json();
        setVendasConfirmadas(Array.isArray(dados) ? dados : []);
      } catch (err) {
        console.error("Erro ao carregar vendas:", err);
        setVendasConfirmadas([]);
      }
    };

    carregarProdutos();
    carregarVendas();
  }, []);

  // 🔹 Confirmar venda
  const confirmarVenda = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/vendas/${id}/confirmar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setVendasConfirmadas((prev) =>
          prev.map((v) => (v._id === id ? { ...v, status: "confirmada" } : v))
        );
      }
    } catch (err) {
      console.error("Erro ao confirmar venda:", err);
    }
  };

  const emitirFactura = (id) => {
    alert(`📑 Factura emitida para venda ${id}`);
  };

  // 🔹 Helpers
  const formatarKz = (val) =>
    new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA" }).format(val);

  const formatarPorcentagem = (val) => `${val.toFixed(2)}%`;

  // 🔹 Filtros aplicados
  const produtosFiltrados = useMemo(
    () =>
      produtos.filter((p) => {
        const mes = new Date(p.createdAt).getMonth() + 1;
        return (
          (!filtroMes || mes === parseInt(filtroMes)) &&
          (!filtroNome || p.nome.toLowerCase().includes(filtroNome.toLowerCase()))
        );
      }),
    [produtos, filtroMes, filtroNome]
  );

  // 🔹 Preparar dados para gráfico
  const dadosGrafico = useMemo(
    () =>
      produtosFiltrados.map((p, i) => ({
        nome: p.nome,
        estoque: parseInt(p.quantidade) || 0,
        preco: parseFloat(p.preco) || 0,
        custo: p.custo !== undefined ? parseFloat(p.custo) || 0 : 0, // custo inserido pelo vendedor
        imagem: p.imagem,
        createdAt: p.createdAt,
        fill: cores[i % cores.length],
      })),
    [produtosFiltrados]
  );

  // 🔹 Atualizar custo manualmente
  const atualizarCusto = (index, valor) => {
    if (valor < 0) {
      alert("⚠️ O custo unitário não pode ser negativo.");
      return;
    }
    const novos = [...produtos];
    novos[index].custo = valor;
    setProdutos(novos);
  };

  // 🔹 Cálculos financeiros reais
  const totalEstoque = dadosGrafico.reduce((acc, p) => acc + p.estoque, 0);
  const precoTotal = dadosGrafico.reduce((acc, p) => acc + p.estoque * p.preco, 0);
  const investimentoTotal = dadosGrafico.reduce(
    (acc, p) => (p.custo > 0 ? acc + p.estoque * p.custo : acc),
    0
  );
  const lucroEstimado = precoTotal - investimentoTotal;
  const margem = investimentoTotal > 0 ? (lucroEstimado / investimentoTotal) * 100 : 0;

  // 🔹 Recomendação automática
  const recomendacoes = (() => {
    const analisesPorProduto = dadosGrafico.map((p) => {
      if (p.custo <= 0) {
        return {
          nome: p.nome,
          estoque: p.estoque,
          valorStock: p.estoque * p.preco,
          lucro: 0,
          margem: 0,
          invalido: true,
        };
      }
      const custoTotal = p.custo * p.estoque;
      const totalProduto = p.estoque * p.preco;
      const lucroProduto = totalProduto - custoTotal;
      const margemProduto = custoTotal > 0 ? (lucroProduto / custoTotal) * 100 : 0;

      return {
        nome: p.nome,
        estoque: p.estoque,
        valorStock: totalProduto,
        lucro: lucroProduto,
        margem: margemProduto,
        invalido: false,
      };
    });

    const validos = analisesPorProduto.filter((p) => !p.invalido);
    validos.sort((a, b) => b.lucro - a.lucro);
    const maisRentavel = validos.length > 0 ? validos[0] : null;
    const menosRentavel = validos.length > 0 ? validos[validos.length - 1] : null;

    const analisesHtml = analisesPorProduto
      .map((p) =>
        p.invalido
          ? `<li><strong>${p.nome}</strong>: ⚠️ custo inválido ou ausente, impossível calcular rentabilidade.</li>`
          : `<li><strong>${p.nome}</strong>: ${p.estoque} unidades em stock, 
              ${formatarKz(p.valorStock)} em valor total, 
              lucro de ${formatarKz(p.lucro)} (${formatarPorcentagem(p.margem)}).</li>`
      )
      .join("");

    let resumo = "";
    if (lucroEstimado < 0) {
      resumo = `
        <p class="text-red-700 font-bold">
          ⚠️ Situação crítica: prejuízo global de ${formatarKz(lucroEstimado)} 
          (${formatarPorcentagem(margem)}). Rever custos, preços e rotação de stock.
        </p>`;
    } else if (margem < 20) {
      resumo = `
        <p class="text-yellow-700 font-bold">
          📉 Margem global baixa: ${formatarKz(lucroEstimado)} (${formatarPorcentagem(
        margem
      )}). Negociar com fornecedores, reduzir custos logísticos e aplicar promoções.
        </p>`;
    } else {
      resumo = `
        <p class="text-green-700 font-bold">
          ✅ Saúde financeira sólida: lucro estimado de ${formatarKz(
            lucroEstimado
          )} (${formatarPorcentagem(margem)}). 
          Reinvestir em marketing e avaliar expansão controlada.
        </p>`;
    }

const conclusao = (() => {
  const validos = analisesPorProduto.filter((p) => !p.invalido);

  if (validos.length === 0) {
    return `
      <p class="mt-4 text-yellow-700 font-bold">
        ⚠️ Não há produtos com custos válidos para análise de rentabilidade neste momento.
      </p>
    `;
  }

  if (validos.length === 1) {
    const unico = validos[0];
    return `
      <p class="mt-4">
        Apenas o produto <strong>${unico.nome}</strong> possui custos válidos inseridos. 
        Ele apresenta lucro de ${formatarKz(unico.lucro)} 
        (${formatarPorcentagem(unico.margem)}). 
        Recomenda-se inserir os custos dos restantes produtos para uma análise comparativa mais robusta.
      </p>
    `;
  }

  const positivos = validos.filter((p) => p.lucro > 0);
  const negativos = validos.filter((p) => p.lucro <= 0);

  if (positivos.length === 0) {
    const pior = validos.reduce((a, b) => (a.lucro < b.lucro ? a : b));
    return `
      <p class="mt-4 text-red-700 font-bold">
        ⚠️ Todos os produtos apresentam prejuízo. 
        O de pior desempenho é <strong>${pior.nome}</strong>, 
        com perda de ${formatarKz(pior.lucro)} (${formatarPorcentagem(pior.margem)}).
        É urgente rever preços, custos e estratégias de venda.
      </p>
    `;
  }

  const maisRentavel = positivos.reduce((a, b) => (a.lucro > b.lucro ? a : b));
  const menosRentavel = validos.reduce((a, b) => (a.lucro < b.lucro ? a : b));

  return `
    <p class="mt-4">
      O produto mais rentável actualmente é <strong>${maisRentavel.nome}</strong>, 
      gerando ${formatarKz(maisRentavel.lucro)} (${formatarPorcentagem(maisRentavel.margem)}). 
      O menos rentável é <strong>${menosRentavel.nome}</strong>, 
      com ${formatarKz(menosRentavel.lucro)} (${formatarPorcentagem(menosRentavel.margem)}). 
      Recomenda-se fortalecer a oferta do produto mais rentável e implementar ajustes no menos 
      rentável (redução de custos, alteração de preço, ou até retirada do catálogo se inviável).
    </p>
  `;
})();



    return `
  ${resumo}
  <ul class="list-disc ml-6 mt-2">${analisesHtml}</ul>
  ${conclusao}
  <p class="mt-4 text-sm text-gray-600">
    📞 Para apoio técnico e financeiro, contacte a Linha de Apoio MercadoYangue: 
    <strong>+244 923 000 111</strong>.
  </p>
`;
})();

  const imprimir = () => {
    const janela = window.open("", "_blank");
    janela.document.write(`
      <html><head><title>Relatório</title></head><body>${refImpressao.current.innerHTML}</body></html>
    `);
    janela.document.close();
    janela.focus();
    janela.print();
  };

  // 🔹 Render
  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded shadow text-gray-800 space-y-6">
      <h2 className="text-3xl font-extrabold text-green-900 text-center mb-4">
        Relatório de Gestão de Produtos - MercadoYangue
      </h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="number"
          min="1"
          max="12"
          className="border p-1 w-full"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          placeholder="Filtrar por mês (MM)"
        />
        <input
          type="text"
          className="border p-1 w-full"
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          placeholder="Filtrar por nome"
        />
      </div>

      <div ref={refImpressao} className="space-y-6">
        {/* Gráfico */}
        <div>
          <h3 className="text-xl font-semibold">📊 Gráfico de Colunas</h3>
          <ResponsiveContainer height={300}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="estoque">
                {dadosGrafico.map((entry, index) => (
                  <Cell key={`cell-bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela de Estoque */}
        <div>
          <h3 className="text-lg font-bold mt-6">📋 Estoque de Produtos</h3>
          <table className="w-full border mt-2">
            <thead>
              <tr className="bg-green-100">
                <th className="border p-2">Imagem</th>
                <th className="border p-2">Produto</th>
                <th className="border p-2">Estoque</th>
                <th className="border p-2">Preço Unitário</th>
                <th className="border p-2">Custo Unitário</th>
                <th className="border p-2">Subtotal</th>
                <th className="border p-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {dadosGrafico.map((p, i) => (
                <tr key={i} className="hover:bg-gray-100">
                  <td className="border p-2">
                    <img
                      src={`http://localhost:5000/uploads/${p.imagem}`}
                      alt={p.nome}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="border p-2">{p.nome}</td>
                  <td className="border p-2">{p.estoque}</td>
                  <td className="border p-2">{formatarKz(p.preco)}</td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0"
                      value={p.custo}
                      onChange={(e) =>
                        atualizarCusto(i, parseFloat(e.target.value) || 0)
                      }
                      className="border rounded px-2 py-1 w-24"
                    />
                  </td>
                  <td className="border p-2">{formatarKz(p.estoque * p.preco)}</td>
                  <td className="border p-2">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td colSpan="2" className="border p-2">Totais:</td>
                <td className="border p-2">{totalEstoque}</td>
                <td className="border p-2">-</td>
                <td className="border p-2">{formatarKz(investimentoTotal)}</td>
                <td className="border p-2">{formatarKz(precoTotal)}</td>
                <td className="border p-2">-</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Recomendações */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
          <div dangerouslySetInnerHTML={{ __html: recomendacoes }} />
        </div>

        {/* Vendas confirmadas */}
        <div>
          <h3 className="text-xl font-semibold mt-6">📒 Vendas Realizadas</h3>
          {vendasConfirmadas.length === 0 ? (
            <p className="text-gray-600 italic">Nenhuma venda registada ainda.</p>
          ) : (
            <table className="w-full border mt-2">
              <thead className="bg-green-100">
                <tr>
                  <th className="p-2 border">Produto</th>
                  <th className="p-2 border">Quantidade</th>
                  <th className="p-2 border">Preço</th>
                  <th className="p-2 border">Total</th>
                  <th className="p-2 border">Data</th>
                  <th className="p-2 border">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendasConfirmadas.map((venda, i) => (
                  <tr key={i} className="hover:bg-gray-100">
                    <td className="p-2 border">{venda.produtos[0]?.nome}</td>
                    <td className="p-2 border">{venda.produtos[0]?.quantidade}</td>
                    <td className="p-2 border">{formatarKz(venda.produtos[0]?.preco)}</td>
                    <td className="p-2 border">
                      {formatarKz(
                        venda.produtos[0]?.preco * venda.produtos[0]?.quantidade
                      )}
                    </td>
                    <td className="p-2 border">
                      {new Date(venda.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-2 border space-x-2">
                      {venda.status === "pendente" ? (
                        <button
                          onClick={() => confirmarVenda(venda._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Confirmar
                        </button>
                      ) : (
                        <span className="text-green-700 font-bold">✅ Confirmada</span>
                      )}
                      <button
                        onClick={() => emitirFactura(venda._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Factura
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <button
        onClick={imprimir}
        className="mt-6 bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
      >
        📤 Exportar Relatório Completo
      </button>
    </div>
  );
};

export default AbaGestaoVendas;

