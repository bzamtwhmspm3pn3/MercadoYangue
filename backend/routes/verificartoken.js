const jwt = require('jsonwebtoken');

function verificartoken(req, res, next) {
  const authheader = req.headers.authorization;

  if (!authheader || !authheader.startswith('bearer ')) {
    return res.status(401).json({ msg: 'token não fornecido' });
  }

  const token = authheader.split(' ')[1];

  try {
    // verifica o token com a chave secreta
    const decoded = jwt.verify(token, process.env.jwt_secret);

    // ajusta req.user para usar nas rotas protegidas
    req.user = { id: decoded._id, nome: decoded.nome, email: decoded.email };

    next();
  } catch (err) {
    return res.status(401).json({ msg: 'token inválido' });
  }
}

module.exports = verificartoken;

