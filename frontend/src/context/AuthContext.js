import React, { createContext, useState } from 'react';

// Cria o contexto
export const AuthContext = createContext();

// Componente provedor do contexto
export const AuthProvider = ({ children }) => {
  // Estado simples de usuário para exemplo
  const [usuario, setUsuario] = useState(null);

  // Função para simular login (exemplo)
  const login = (dadosUsuario) => {
    setUsuario(dadosUsuario);
  };

  // Função para logout
  const logout = () => {
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
