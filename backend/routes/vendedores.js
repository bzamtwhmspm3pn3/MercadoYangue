const express = require('express');
const router = express.Router();

// Simulação temporária: ainda não salva no DB
router.post('/solicitar-selo', (req, res) => {
  const { vendedorId } = req.body;

  if (!vendedorId) {
    return res.status(400).json({ msg: "vendedorId é obrigatório" });
  }

  console.log("Selo solicitado para vendedor:", vendedorId);

  // Retorna sucesso mesmo sem backend
  return res.status(200).json({ msg: "Selo solicitado com sucesso" });
});

module.exports = router;
