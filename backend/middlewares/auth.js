const jwt = require('jsonwebtoken');

// Middleware obrigatório: exige token válido
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo-padrao');
    req.user = decoded; // Padrão para guardar info do utilizador autenticado
    next();
  } catch (err) {
    console.error('🔐 Token inválido ou expirado:', err);
    return res.status(403).json({ msg: 'Token inválido ou expirado.' });
  }
};

// Middleware opcional: tenta decodificar token, se houver
const authOptionalMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo-padrao');
      req.user = decoded;
    } catch (err) {
      console.warn('⚠️ Token inválido em rota opcional:', err.message);
      // Continua como anónimo
    }
  }

  next();
};

module.exports = {
  authMiddleware,
  authOptionalMiddleware,
};