// ComprasContext.jsx
import React, { createContext, useState, useContext } from "react";

const ComprasContext = createContext();

export const useCompras = () => useContext(ComprasContext);

export const ComprasProvider = ({ children }) => {
  const [compras, setCompras] = useState([]);
  return (
    <ComprasContext.Provider value={{ compras, setCompras }}>
      {children}
    </ComprasContext.Provider>
  );
};
