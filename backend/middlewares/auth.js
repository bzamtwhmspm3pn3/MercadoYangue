const jwt = require('jsonwebtoken');

// middleware obrigatório: exige token válido
const authmiddleware = (req, res, next) => {
  const authheader = req.headers.authorization;

  if (!authheader?.startswith('bearer ')) {
    return res.status(401).json({ msg: 'token de autenticação não fornecido.' });
  }

  const token = authheader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.jwt_secret || 'segredo-padrao');
    req.user = decoded; // padrão para guardar info do utilizador autenticado
    next();
  } catch (err) {
    console.error('🔐 token inválido ou expirado:', err);
    return res.status(403).json({ msg: 'token inválido ou expirado.' });
  }
};

// middleware opcional: tenta decodificar token, se houver
const authoptionalmiddleware = (req, res, next) => {
  const authheader = req.headers.authorization;

  if (authheader?.startswith('bearer ')) {
    const token = authheader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.jwt_secret || 'segredo-padrao');
      req.user = decoded;
    } catch (err) {
      console.warn('⚠️ token inválido em rota opcional:', err.message);
      // continua como anónimo
    }
  }

  next();
};

module.exports = {
  authmiddleware,
  authoptionalmiddleware,
};