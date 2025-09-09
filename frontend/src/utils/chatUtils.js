// Gera chave única para cada conversa
export function gerarChaveChat(usuario1, usuario2) {
  const ordenados = [usuario1, usuario2].sort();
  return `chat_${ordenados[0]}_${ordenados[1]}`;
}

// Formata valores para moeda Kz
export function formatarValor(valor) {
  return Number(valor).toLocaleString('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0
  }).replace('AOA', 'Kz');
}

// Envia mensagem automática com base nos dados da compra
export function enviarMensagemCompraAutomatica({
  cliente,
  vendedor,
  itensComprados = [],
  entregador = null,
  setChatState
}) {
  if (!cliente?.nome || !vendedor?.nome || itensComprados.length === 0) return;

  const chatKey = gerarChaveChat(cliente.nome, vendedor.nome);

  const listaProdutos = itensComprados.map(
    item => `• ${item.nome} — ${item.quantidade} x ${formatarValor(item.preco)} = ${formatarValor(item.total)}`
  ).join('\n');

  const dadosEntrega = entregador
    ? `
🚚 Solicitei entrega com os seguintes dados:
• Entregador: ${entregador.nome}
• Veículo: ${entregador.veiculo}
• Localização: ${entregador.localizacao}
• Tarifa: ${formatarValor(entregador.tarifa)}
• Pagamento: ${entregador.pagamento}
• Contacto: ${entregador.contacto}`
    : '';

  const mensagem = `
Olá! Sou o(a) cliente *${cliente.nome}*. Acabei de comprar os seus produtos no Mercado Yangue:

${listaProdutos}

🧾 Gostaria de receber a factura da compra.

❗ Caso não tenha como emitir, por favor envie uma cópia do seu BI para podermos fazer a autofacturação.${dadosEntrega}

Muito obrigado pela atenção e colaboração. 😊
`.trim();

  const novaMensagem = {
    id: Date.now(),
    texto: mensagem,
    remetente: cliente.nome,
    destinatario: vendedor.nome,
    tipo: 'texto',
    ficheiro: null,
    data: new Date().toISOString(),
    lida: false,
    automatica: true
  };

  try {
    const chatState = JSON.parse(localStorage.getItem('chatState')) || {};
    const mensagensAnteriores = chatState[chatKey] || [];

    const novoEstado = {
      ...chatState,
      [chatKey]: [...mensagensAnteriores, novaMensagem]
    };

    localStorage.setItem('chatState', JSON.stringify(novoEstado));

    if (setChatState) setChatState(novoEstado);

    // Notificações
    const notificacoes = JSON.parse(localStorage.getItem('notificacoesChat') || '{}');
    notificacoes[chatKey] = (notificacoes[chatKey] || 0) + 1;
    localStorage.setItem('notificacoesChat', JSON.stringify(notificacoes));

  } catch (erro) {
    console.error('Erro ao enviar mensagem automática:', erro);
  }
}
