import React from 'react';

function AbaLogistica() {
  const provincias = [
    { nome: "Luanda", prazo: "24-48h", parceiro: "Yangue Express" },
    { nome: "Benguela", prazo: "48-72h", parceiro: "Yangue Express" },
    { nome: "Huambo", prazo: "24-48h", parceiro: "Entrega Local" },
    { nome: "Bié", prazo: "24-48h", parceiro: "Entrega Local" },
    { nome: "Outras Províncias", prazo: "3-5 dias", parceiro: "Yangue Express + Parceiros" },
  ];

  const dicas = [
    { icone: "📍", titulo: "Combine com o Vendedor", descricao: "Use o chat para definir o melhor local de encontro" },
    { icone: "📦", titulo: "Verifique o Produto", descricao: "Inspecione antes de finalizar a compra" },
    { icone: "💳", titulo: "Pagamento Seguro", descricao: "Use os métodos de pagamento acordados na plataforma" },
    { icone: "⭐", titulo: "Avalie a Experiência", descricao: "Sua avaliação ajuda outros compradores" }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">📦 Logística e Entregas</h2>
        <p className="opacity-90">Como receber seus produtos do campo até a sua mesa</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <h3 className="text-xl font-bold text-green-800 mb-3">🚚 Modelo de Entrega</h3>
          <p className="text-gray-700">
            O vendedor e o comprador combinam a entrega diretamente pelo <strong>chat integrado</strong>. 
            O Mercado Yangue sugere pontos de encontro seguros ou parceiros logísticos locais para facilitar o processo.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <h3 className="text-xl font-bold text-green-800 mb-3">📍 Pontos de Retirada</h3>
          <p className="text-gray-700">
            Estabeleceremos pontos físicos em <strong>Luanda, Benguela, Huambo e Kuito</strong> para retirada de produtos,
            reduzindo custos de entrega e garantindo mais segurança.
          </p>
          <div className="mt-3 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            🚀 Em breve: Primeiros pontos de retirada
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-xl font-bold text-green-700 p-6 pb-0">Prazos Estimados por Província</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-green-100">
              <tr>
                <th className="py-3 px-6 text-left font-semibold text-green-800">Província</th>
                <th className="py-3 px-6 text-left font-semibold text-green-800">Prazo Estimado</th>
                <th className="py-3 px-6 text-left font-semibold text-green-800">Parceiro de Entrega</th>
              </tr>
            </thead>
            <tbody>
              {provincias.map((prov, idx) => (
                <tr key={idx} className="border-b border-green-100 hover:bg-green-50">
                  <td className="py-3 px-6 font-medium">{prov.nome}</td>
                  <td className="py-3 px-6">{prov.prazo}</td>
                  <td className="py-3 px-6">{prov.parceiro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 p-4 text-center">
          *Os prazos são estimados e podem variar de acordo com a localização exata do vendedor e comprador
        </p>
      </div>

      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-xl font-bold text-green-800 mb-4">💡 Dicas para uma Entrega Segura</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {dicas.map((dica, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl mb-2">{dica.icone}</div>
              <div className="font-semibold text-gray-800">{dica.titulo}</div>
              <div className="text-sm text-gray-600">{dica.descricao}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Precisa de ajuda com a entrega?</h3>
        <p className="text-gray-600 mb-4">Entre em contacto com o nosso suporte</p>
        <button
          onClick={() => window.open('https://wa.me/244923000000')}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
        >
          📱 Falar com Suporte
        </button>
      </div>
    </div>
  );
}

export default AbaLogistica;