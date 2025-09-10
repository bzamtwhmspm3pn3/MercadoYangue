import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

export const gerarFacturaProfissional = async (vendas, usuario) => {
  try {
    if (!Array.isArray(vendas) || vendas.length === 0) {
      alert("Nenhuma venda confirmada para gerar factura.");
      return;
    }

    const doc = new jsPDF();
    const dataAgora = new Date();
    const numeroFactura = `MY${dataAgora.getFullYear()}-C${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // Cabeçalho
    doc.setFontSize(16);
    doc.setTextColor(40, 100, 60);
    doc.text("🧾 Mercado Yangue - Factura Comercial", 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Factura Nº: ${numeroFactura}`, 10, 30);
    doc.text(`Data: ${dataAgora.toLocaleDateString()} | Hora: ${dataAgora.toLocaleTimeString()}`, 10, 35);
    doc.text(`Emitido por: ${usuario?.nome || '---'}`, 10, 42);
    doc.text(`Email: ${usuario?.email || '---'}`, 10, 47);
    doc.text(`Contacto: ${usuario?.telefone || '---'}`, 10, 52);

    // Produtos
    const linhasProdutos = [];
    vendas.forEach(venda => {
      if (Array.isArray(venda.produtos)) {
        venda.produtos.forEach(p => {
          linhasProdutos.push([
            p.nome || '---',
            p.quantidade ?? '-',
            `${(p.preco || 0).toLocaleString()} AOA`,
            `${((p.quantidade || 0) * (p.preco || 0)).toLocaleString()} AOA`
          ]);
        });
      }
    });

    // Se não há produtos válidos, avisar
    if (linhasProdutos.length === 0) {
      alert("Não foi possível encontrar produtos válidos nesta venda.");
      return;
    }

    // Tabela
    doc.autoTable({
      startY: 60,
      head: [['Produto', 'Qtd', 'Preço Unit.', 'Subtotal']],
      body: linhasProdutos,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [56, 161, 105] },
      margin: { left: 10, right: 10 },
    });

    const total = vendas.reduce((acc, venda) =>
      acc + (venda.produtos || []).reduce((s, p) =>
        s + (p.quantidade || 0) * (p.preco || 0), 0), 0);

    const comissao = total * 0.05;
    const posY = doc.autoTable.previous.finalY + 10;

    // Totais e pagamento
    doc.setFontSize(11);
    doc.text(`💰 Total Geral: ${total.toLocaleString()} AOA`, 10, posY);
    doc.text(`📊 Comissão MercadoYangue (5%): ${comissao.toLocaleString()} AOA`, 10, posY + 6);
    doc.text("🏦 Dados Bancários para Pagamento da Comissão:", 10, posY + 15);
    doc.setFont("helvetica", "bold");
    doc.text("Banco: BAI - Agência Huambo Centro", 10, posY + 22);
    doc.text("IBAN: AO06 0000 0000 1234 5678 9012 3456 7", 10, posY + 28);
    doc.text("Beneficiário: Mercado Yangue Serviços Digitais", 10, posY + 34);
    doc.setFont("helvetica", "normal");

    // QRCode
    const qrText = `https://mercadoyangue.co.ao/factura/${numeroFactura}`;
    const qrDataURL = await QRCode.toDataURL(qrText);
    doc.addImage(qrDataURL, 'PNG', 160, posY, 35, 35);

    // Rodapé
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Este documento serve como comprovativo de venda no sistema Mercado Yangue.", 10, 285);

    doc.save(`${numeroFactura}.pdf`);
  } catch (err) {
    console.error("❌ Erro ao gerar a factura:", err);
    alert("Erro inesperado ao gerar a factura. Tente novamente.");
  }
};
