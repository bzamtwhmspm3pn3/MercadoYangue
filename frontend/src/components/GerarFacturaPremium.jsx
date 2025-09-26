import { useState } from "react";
import { jsPDF } from "jspdf";
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
  const [numeroFactura, setNumeroFactura] = useState("");

  // 🔹 Pegar próximo número da fatura do backend
  const obterNumeroFaturaBackend = async () => {
    const res = await fetch("/api/fatura/proximo-numero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendedorId: usuario.id }),
    });
    const data = await res.json();
    return data.numeroFactura;
  };

  const gerarFactura = async () => {
    try {
      const numFatura = await obterNumeroFaturaBackend();
      setNumeroFactura(numFatura);

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // 🔹 Cabeçalho
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#008000");
      doc.text("Factura MercadoYangue", pageWidth / 2, 50, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#000");
      doc.text(`Factura Nº: ${numFatura}`, 400, 80);
      doc.text(`Emitida em: ${new Date().toLocaleString("pt-AO")}`, 400, 95);

      // 🔹 Vendedor / Comprador
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Vendedor:", 40, 130);
      doc.setFont("helvetica", "normal");
      doc.text(`${usuario.nome}`, 120, 130);

      doc.setFont("helvetica", "bold");
      doc.text("Comprador:", 40, 145);
      doc.setFont("helvetica", "normal");
      doc.text(`${venda.comprador?.nome || "N/A"}`, 120, 145);

      // 🔹 Produtos
      const produtosTabela = venda.produtos.map((p, i) => [
        i + 1,
        p.produto?.nome || p.produto,
        p.quantidade,
        formatarKz(p.preco),
        formatarKz(p.preco * p.quantidade),
      ]);

      autoTable(doc, {
        head: [["#", "Produto", "Qtd", "Preço Unit.", "Total"]],
        body: produtosTabela,
        startY: 180,
        theme: "grid",
        headStyles: { fillColor: [0, 128, 0], textColor: 255, fontStyle: "bold", halign: "center" },
        bodyStyles: { fontSize: 10, cellPadding: 6, halign: "center" },
        alternateRowStyles: { fillColor: [242, 242, 242] },
      });

      const total = venda.produtos.reduce((acc, p) => acc + p.preco * p.quantidade, 0);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        body: [["Total a Pagar", formatarKz(total)]],
        theme: "grid",
        bodyStyles: { fontSize: 11, fontStyle: "bold", halign: "center", textColor: [0, 128, 0] },
      });

      // 🔹 QR Code apenas com os dados essenciais
      const qrData = {
        nomeVendedor: usuario.nome,
        nomeComprador: venda.comprador?.nome,
        produtos: venda.produtos.map((p) => p.produto?.nome || p.produto),
        quantidades: venda.produtos.map((p) => p.quantidade),
        valoresTotais: venda.produtos.map((p) => p.preco * p.quantidade),
        localEntrega,
        dataEmissao: new Date().toLocaleString("pt-AO"),
      };
      const qrBase64 = await QRCode.toDataURL(JSON.stringify(qrData));
      const qrY = doc.internal.pageSize.getHeight() - 140;
      doc.addImage(qrBase64, "PNG", pageWidth - 140, qrY, 100, 100);

      // 🔹 Rodapé
      doc.setFontSize(10);
      doc.text(`Local de Entrega: ${localEntrega} | Emitida em: ${new Date().toLocaleString("pt-AO")}`, 40, qrY + 120);

      // 🔹 Salvar PDF
      const nomePDF = `Factura_${numFatura.replace(/[:\/]/g, "_")}.pdf`;
      doc.save(nomePDF);
      setShowModal(false);
      alert("✅ Fatura gerada com sucesso!");
    } catch (err) {
      console.error(err);
      alert("❌ Falha ao gerar fatura.");
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
            <h2 className="text-lg font-bold mb-4 text-center">Dados do Comprador</h2>
            <input type="text" value={compradorNif} onChange={(e) => setCompradorNif(e.target.value)} placeholder="NIF Comprador" className="border px-2 py-1 w-full mb-2"/>
            <input type="text" value={compradorMorada} onChange={(e) => setCompradorMorada(e.target.value)} placeholder="Morada" className="border px-2 py-1 w-full mb-2"/>
            <input type="text" value={compradorContactos} onChange={(e) => setCompradorContactos(e.target.value)} placeholder="Contactos" className="border px-2 py-1 w-full mb-4"/>
            <input type="text" value={localEntrega} onChange={(e) => setLocalEntrega(e.target.value)} placeholder="Local de Entrega" className="border px-2 py-1 w-full mb-4"/>
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

export default GerarFacturaPremium;
