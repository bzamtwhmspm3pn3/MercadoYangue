import React, { useState, useEffect, useRef, useMemo } from "react";

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
  Legend
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
import QRCode from "qrcode";


const GerarFacturaPremium = ({ venda, usuario, formatarKz }) => {
  const [showModal, setShowModal] = useState(false);
  const [compradorNif, setCompradorNif] = useState(venda.comprador?.nif || "");
  const [compradorMorada, setCompradorMorada] = useState(venda.comprador?.morada || "");
  const [compradorContactos, setCompradorContactos] = useState(venda.comprador?.contactos || "");
  const [vendedorNif, setVendedorNif] = useState(usuario.nif || "");
  const [vendedorMorada, setVendedorMorada] = useState(usuario.endereco || "");
  const [localEntrega, setLocalEntrega] = useState(venda.local || "");
  const [desconto, setDesconto] = useState(venda.desconto || 0);

  // 🔹 Funções para número sequencial
  const getUltimoNumero = () => {
    const ultimo = localStorage.getItem("ultimoNumFactura");
    return ultimo ? Number(ultimo) : 0;
  };

  const setProximoNumero = (num) => {
    localStorage.setItem("ultimoNumFactura", num);
  };

  // 🔹 Número sequencial inicial
  const [numeroFactura, setNumeroFactura] = useState(() => {
    const anoAtual = new Date().getFullYear();
    const numSeq = getUltimoNumero() + 1;
    setProximoNumero(numSeq);
    return `FT-MY: ${String(numSeq).padStart(4, "0")}/${anoAtual}`;
  });

  const gerarFactura = async () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // 🔹 Logo
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
      const logoSize = 120;
      doc.addImage(logoBase64, "PNG", 40, 30, logoSize, logoSize);

      // 🔹 Cabeçalho
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#008000");
      doc.text("Factura MercadoYangue", pageWidth / 2, 70, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#000");
      doc.text(`Emitida em: ${new Date().toLocaleString("pt-AO")}`, 400, 110);
      doc.text(`Factura Nº: ${numeroFactura}`, 400, 125);

      // 🔹 Vendedor / Comprador
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Vendedor:", 40, 160);
      doc.setFont("helvetica", "normal");
      doc.text(`${usuario.nome} | NIF: ${vendedorNif}`, 120, 160);
      doc.text(`${vendedorMorada}`, 120, 175);

      doc.setFont("helvetica", "bold");
      doc.text("Comprador:", 40, 190);
      doc.setFont("helvetica", "normal");
      doc.text(`${venda.comprador?.nome || "N/A"} | NIF: ${compradorNif}`, 120, 190);
      doc.text(`Morada: ${compradorMorada}`, 120, 205);
      doc.text(`Contactos: ${compradorContactos}`, 120, 220);
      doc.text(`Local de entrega: ${localEntrega}`, 120, 235);

      // 🔹 Produtos e Totais
      const descontoGlobal = desconto || 0;
      const subtotalBruto = venda.produtos.reduce((acc, p) => acc + p.preco * p.quantidade, 0);
      const produtosComValores = venda.produtos.map(p => {
        const precoTotal = p.preco * p.quantidade;
        const descontoProporcional = (precoTotal / subtotalBruto) * descontoGlobal;
        let taxaIVA = p.categoriaFiscal === "14%" ? 0.14 : p.categoriaFiscal === "5%" ? 0.05 : 0;
        const valorLiquido = precoTotal - descontoProporcional;
        const valorIVA = valorLiquido * taxaIVA;
        return { ...p, descontoProporcional, valorLiquido, valorIVA, totalComIVA: valorLiquido + valorIVA };
      });

      const tabelaProdutos = produtosComValores.map((p, i) => [
        i + 1,
        p.produto?.nome || p.produto,
        p.quantidade,
        formatarKz(p.preco),
        formatarKz(p.valorLiquido),
        formatarKz(p.valorIVA),
        formatarKz(p.totalComIVA)
      ]);

      autoTable(doc, {
        head: [["#", "Produto", "Qtd", "Preço Unit.", "Subtotal Líquido", "IVA", "Total"]],
        body: tabelaProdutos,
        startY: 255,
        theme: "grid",
        headStyles: { fillColor: [0, 128, 0], textColor: 255, fontStyle: "bold", halign: "center" },
        bodyStyles: { fontSize: 10, cellPadding: 6, halign: "center" },
        alternateRowStyles: { fillColor: [242, 242, 242] },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.5
      });

      const valorDesconto = produtosComValores.reduce((acc, p) => acc + p.descontoProporcional, 0);
      const valorMercadoriaLiquida = produtosComValores.reduce((acc, p) => acc + p.valorLiquido, 0);
      const valorIVA = produtosComValores.reduce((acc, p) => acc + p.valorIVA, 0);
      const totalPagar = valorMercadoriaLiquida + valorIVA;

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        body: [
          ["Subtotal Bruto", formatarKz(subtotalBruto)],
          ["Desconto Aplicado", formatarKz(valorDesconto)],
          ["Subtotal Líquido", formatarKz(valorMercadoriaLiquida)],
          ["IVA Total", formatarKz(valorIVA)],
          ["Total a Pagar", formatarKz(totalPagar)]
        ],
        theme: "grid",
        bodyStyles: { fontSize: 10, cellPadding: 5, halign: "center" }
      });

      // 🔹 Observações
      doc.setFontSize(10);
      doc.setTextColor("#000");
      const obsText = "Sistema de Facturação: MercadoYangue - www.mercadoyangue.com, validação AGT v12MY";
      doc.text(obsText, 40, doc.lastAutoTable.finalY + 20, { maxWidth: pageWidth - 80, align: "justify" });

      // 🔹 QR Code
      const qrData = {
        numeroFactura,
        vendedor: { nome: usuario.nome, nif: vendedorNif, morada: vendedorMorada },
        comprador: { nome: venda.comprador?.nome, nif: compradorNif, morada: compradorMorada, contactos: compradorContactos },
        produtos: produtosComValores.map(p => ({
          nome: p.produto?.nome || p.produto,
          quantidade: p.quantidade,
          precoUnit: formatarKz(p.preco),
          subtotalLiquido: formatarKz(p.valorLiquido),
          iva: formatarKz(p.valorIVA),
          total: formatarKz(p.totalComIVA)
        })),
        descontoGlobal: formatarKz(valorDesconto),
        totalPagar: formatarKz(totalPagar),
        localEntrega
      };
      const qrBase64 = await QRCode.toDataURL(JSON.stringify(qrData));
      const qrY = doc.internal.pageSize.getHeight() - 140;
      doc.addImage(qrBase64, "PNG", pageWidth - 140, qrY, 100, 100);

      // 🔹 Salvar PDF
      const nomePDF = `Factura_${numeroFactura.replace(/[:\/]/g, "_")}.pdf`;
      doc.save(nomePDF);
      alert("✅ Fatura profissional gerada com sucesso!");
      setShowModal(false);

      // 🔹 Incrementa número sequencial para próxima emissão
      const proxNum = getUltimoNumero() + 1;
      const anoAtual = new Date().getFullYear();
      setNumeroFactura(`FT-MY: ${String(proxNum).padStart(4, "0")}/${anoAtual}`);
      setProximoNumero(proxNum);

    } catch (err) {
      console.error(err);
      alert("❌ Falha ao gerar fatura. Ver console.");
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Gerar Factura 
      </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4 text-center">Completar Dados do Comprador e Vendedor</h2>
            {/* Inputs */}
            <label className="block mb-1 font-semibold">NIF Vendedor</label>
            <input type="text" value={vendedorNif} onChange={(e) => setVendedorNif(e.target.value)} className="border px-2 py-1 w-full mb-2"/>
            <label className="block mb-1 font-semibold">Morada Vendedor</label>
            <input type="text" value={vendedorMorada} onChange={(e) => setVendedorMorada(e.target.value)} className="border px-2 py-1 w-full mb-2"/>
            <label className="block mb-1 font-semibold">NIF Comprador</label>
            <input type="text" value={compradorNif} onChange={(e) => setCompradorNif(e.target.value)} className="border px-2 py-1 w-full mb-2"/>
            <label className="block mb-1 font-semibold">Morada Comprador</label>
            <input type="text" value={compradorMorada} onChange={(e) => setCompradorMorada(e.target.value)} className="border px-2 py-1 w-full mb-2"/>
            <label className="block mb-1 font-semibold">Contactos Comprador</label>
            <input type="text" value={compradorContactos} onChange={(e) => setCompradorContactos(e.target.value)} className="border px-2 py-1 w-full mb-2"/>
            <label className="block mb-1 font-semibold">Local de Entrega</label>
            <input type="text" value={localEntrega} onChange={(e) => setLocalEntrega(e.target.value)} className="border px-2 py-1 w-full mb-2"/>
            <label className="block mb-1 font-semibold">Desconto</label>
            <input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} className="border px-2 py-1 w-full mb-4"/>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-3 py-1 bg-gray-400 rounded">Cancelar</button>
              <button onClick={gerarFactura} className="px-3 py-1 bg-green-600 text-white rounded">Gerar PDF</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


const cores = ["#38a169", "#2b6cb0", "#d69e2e", "#9f7aea", "#ed8936"];

const AbaGestaoVendas = ({ usuario }) => {
  const [produtos, setProdutos] = useState([]);
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [vendasConfirmadas, setVendasConfirmadas] = useState([]);
  const refImpressao = useRef();


// Fora do JSX, no topo do componente
const converterExtenso = (valor) => {
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const especiais = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezasseis", "dezassete", "dezoito", "dezanove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  if (valor < 10) return unidades[valor];
  if (valor < 20) return especiais[valor - 10];
  if (valor < 100) {
    const dez = Math.floor(valor / 10);
    const uni = valor % 10;
    return `${dezenas[dez]}${uni > 0 ? " e " + unidades[uni] : ""}`;
  }
  return valor.toLocaleString("pt-AO") + " Kz"; // fallback para valores maiores
};

  // 🔹 Buscar produtos e vendas
useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const carregarProdutos = async () => {
    try {
      const res = await fetch("https://mercadoyangue-i3in.onrender.com/api/produtos/meus-produtos", {
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
      const res = await fetch("https://mercadoyangue-i3in.onrender.com/api/vendas/vendedor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar vendas do vendedor");
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
    const res = await fetch(`https://mercadoyangue-i3in.onrender.com/api/vendas/${id}/confirmar`, {
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

  {/* Gráfico de Estoque */}
  <div>
    <h3 className="text-xl font-semibold">📊 Gráfico de Estoque</h3>
    <ResponsiveContainer height={300}>
      <BarChart data={dadosGrafico}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nome" />
        <YAxis />
        <Tooltip formatter={(value) => formatarKz(value)} />
        <Bar dataKey="estoque" name="Estoque">
          {dadosGrafico.map((entry, index) => (
            <Cell key={`cell-bar-${index}`} fill={entry.fill || "#38a169"} />
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
                value={p.custo || 0}
                onChange={(e) =>
                  atualizarCusto(i, parseFloat(e.target.value) || 0)
                }
                className="border rounded px-2 py-1 w-24"
              />
            </td>
            <td className="border p-2">{formatarKz(p.estoque * p.preco)}</td>
            <td className="border p-2">{new Date(p.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="bg-gray-200 font-bold">
          <td colSpan="2" className="border p-2">Totais:</td>
          <td className="border p-2">{dadosGrafico.reduce((acc, p) => acc + p.estoque, 0)}</td>
          <td className="border p-2">-</td>
          <td className="border p-2">{formatarKz(dadosGrafico.reduce((acc, p) => acc + (p.custo || 0) * p.estoque, 0))}</td>
          <td className="border p-2">{formatarKz(dadosGrafico.reduce((acc, p) => acc + p.estoque * p.preco, 0))}</td>
          <td className="border p-2">-</td>
        </tr>
      </tfoot>
    </table>
  </div>

  {/* Gráfico de Vendas - Pizza */}
  <div>
    <h3 className="text-xl font-semibold mt-6">📊 Distribuição de Vendas Realizadas</h3>
    {vendasConfirmadas.length > 0 ? (
      <ResponsiveContainer height={350}>
        <PieChart>
          <Pie
            data={vendasConfirmadas.map(venda => ({
              name: venda.produtos.map(p => p.produto?.nome || p.produto).join(", "),
              value: venda.produtos.reduce((acc, p) => acc + p.quantidade * p.preco, 0)
            }))}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill="#2b6cb0"
            label={(entry) => `${entry.name}: ${formatarKz(entry.value)}`}
          >
            {vendasConfirmadas.map((v, i) => (
              <Cell key={`cell-pie-${i}`} fill={v.fill || "#38a169"} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatarKz(value)} />
        </PieChart>
      </ResponsiveContainer>
    ) : (
      <p className="text-gray-600 italic">Nenhuma venda registada ainda.</p>
    )}
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
            <th className="p-2 border">Comprador</th>
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
              <td className="p-2 border">{venda.comprador?.nome || "N/A"}</td>
              <td className="p-2 border">{venda.produtos.map((p, idx) => (<div key={idx}>{p.produto?.nome || p.produto}</div>))}</td>
              <td className="p-2 border">{venda.produtos.map((p, idx) => (<div key={idx}>{p.quantidade}</div>))}</td>
              <td className="p-2 border">{venda.produtos.map((p, idx) => (<div key={idx}>{formatarKz(p.preco)}</div>))}</td>
              <td className="p-2 border">
                {venda.produtos.reduce((acc, p) => acc + p.preco * p.quantidade, 0).toLocaleString("pt-AO", { style: "currency", currency: "AOA" })}
              </td>
              <td className="p-2 border">{new Date(venda.createdAt).toLocaleDateString()}</td>
              <td className="p-2 border space-x-2">
                {venda.status === "pendente" ? (
                  <button onClick={() => confirmarVenda(venda._id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Confirmar</button>
                ) : (
                  <span className="text-green-700 font-bold">✅ Confirmada</span>
                )}


<GerarFacturaPremium 
  venda={venda} 
  usuario={usuario} 
  formatarKz={formatarKz} 
/>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>





  {/* 🔹 Comentário Financeiro Automático + Apelo à Consultoria */}
<div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
  {dadosGrafico.length === 0 ? (
    <p>Nenhum dado de estoque disponível.</p>
  ) : (() => {
    // Função segura para calcular margem
    const safeCalc = (produto) =>
      produto?.custo > 0 ? ((produto.preco - produto.custo) / produto.custo) * 100 : null;

    // Cálculos gerais
    const totalEstoque = dadosGrafico.reduce((acc, p) => acc + (p?.estoque || 0), 0);
    const precoTotal = dadosGrafico.reduce((acc, p) => acc + ((p?.estoque || 0) * (p?.preco || 0)), 0);
    const investimentoTotal = dadosGrafico.reduce(
      (acc, p) => acc + ((p?.custo && p.custo > 0 ? p.estoque * p.custo : 0)),
      0
    );
    const lucroEstimado = precoTotal - investimentoTotal;
    const margem = investimentoTotal > 0 ? (lucroEstimado / investimentoTotal) * 100 : 0;

    // Produtos com custos válidos
    const produtosValidos = dadosGrafico.filter((p) => p?.custo > 0 && p.estoque != null && p.preco != null);

    // Produto mais rentável e com maior margem
    const maisRentavel = produtosValidos.reduce(
      (a, b) => (!a || (b.estoque * b.preco > a.estoque * a.preco) ? b : a),
      null
    );
    const maiorMargem = produtosValidos.reduce(
      (a, b) => (!a || (safeCalc(b) > safeCalc(a) ? b : a)),
      null
    );

    return (
      <div>
        {/* Resumo global */}
        {lucroEstimado < 0 ? (
          <p className="text-red-700 font-bold">
            ⚠️ Situação crítica: prejuízo global de {formatarKz(lucroEstimado)} ({margem.toFixed(2)}%). Rever custos, preços e rotação de stock.
          </p>
        ) : margem < 20 ? (
          <p className="text-yellow-700 font-bold">
            📉 Margem global baixa: {formatarKz(lucroEstimado)} ({margem.toFixed(2)}%). Negociar com fornecedores, reduzir custos logísticos e aplicar promoções.
          </p>
        ) : (
          <p className="text-green-700 font-bold">
            ✅ Saúde financeira sólida: lucro estimado de {formatarKz(lucroEstimado)} ({margem.toFixed(2)}%). Reinvestir em marketing e avaliar expansão controlada.
          </p>
        )}

        {/* Detalhes por produto */}
        <ul className="list-disc ml-6 mt-2">
          {dadosGrafico.map((p, idx) => {
            if (!p?.custo || p.custo <= 0 || p.estoque == null || p.preco == null) {
              return (
                <li key={idx}>
                  <strong>{p?.nome || "Produto desconhecido"}</strong>: ⚠️ custo inválido ou ausente, impossível calcular rentabilidade.
                </li>
              );
            }
            const valorStock = p.estoque * p.preco;
            const lucroProduto = valorStock - p.estoque * p.custo;
            const margemProduto = safeCalc(p);
            return (
              <li key={idx}>
                <strong>{p.nome}</strong>: {p.estoque} unidades em stock, {formatarKz(valorStock)} em valor total, lucro de {formatarKz(lucroProduto)} ({margemProduto.toFixed(2)}%).
              </li>
            );
          })}
        </ul>

        {/* Conclusão detalhada */}
        {maisRentavel && maiorMargem && (
          <p className="mt-4">
            O produto mais rentável é <strong>{maisRentavel.nome}</strong> ({formatarKz(maisRentavel.estoque * maisRentavel.preco)} / {safeCalc(maisRentavel)?.toFixed(2)}%).<br/>
            O produto com maior margem é <strong>{maiorMargem.nome}</strong> ({safeCalc(maiorMargem)?.toFixed(2)}%), contribuindo com {formatarKz(maiorMargem.estoque * maiorMargem.preco)}.<br/>
            Recomenda-se fortalecer a oferta do produto mais rentável e analisar estratégias para aumentar o impacto financeiro do produto com maior margem (redução de custos, revisão de preço ou reposicionamento no catálogo).
          </p>
        )}

        {/* Contato e consultoria */}
        <p className="mt-4 text-sm text-gray-600">
          📞 Para apoio técnico e financeiro, contacte a Linha de Apoio MercadoYangue: <strong>+244 923 000 111</strong>.<br/>
          Nossa equipa especializada orienta vendedores e agricultores a assinarem um contrato prémio e maximizar lucros de forma segura, optimizando resultados e evitando riscos. Contacte os nossos serviços de <strong>assessoria e consultoria</strong>.
        </p>
      </div>
    );
  })()}
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

