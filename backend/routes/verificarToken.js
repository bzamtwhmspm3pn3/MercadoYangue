const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica o token com a chave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ajusta req.user para usar nas rotas protegidas
    req.user = { id: decoded._id, nome: decoded.nome, email: decoded.email };

    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token inválido' });
  }
}

module.exports = verificarToken;

