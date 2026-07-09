import React from 'react';

function WhatsAppButton({ telefone = "+244923000000", mensagem = "Olá! Gostaria de mais informações sobre o Mercado Yangue." }) {
  const url = `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-agro-600 text-white p-4 rounded-full shadow-lg hover:bg-agro-700 transition-all duration-300 z-50 flex items-center justify-center gap-2 group"
      style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22 1.5 14.948 1.5 6.75V4.5z" clipRule="evenodd" />
      </svg>
      <span className="hidden group-hover:inline-block text-sm font-semibold">Falar no WhatsApp</span>
    </a>
  );
}

export default WhatsAppButton;