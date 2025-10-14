const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Corrigido: usar 'id' do payload do token
    req.user = { _id: decoded.id, nome: decoded.nome, tipo: decoded.tipo, email: decoded.email };

    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token inválido' });
  }
}

module.exports = verificarToken;
