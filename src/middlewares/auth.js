const { verifyToken } = require('../config/jwt');

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  if (req.query && req.query.token) {
    return req.query.token;
  }

  if (req.headers['x-access-token']) {
    return req.headers['x-access-token'];
  }

  return null;
};

/**
 * Middleware: verifica Bearer token en el header Authorization.
 * Agrega req.user con el payload decodificado.
 */
const authenticate = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ ok: false, message: 'Token requerido.' });
    }
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware: verifica que req.user tenga uno de los roles permitidos.
 * Usar después de authenticate.
 * @param {...number} roles  0=Admin, 1=Barbero, 2=Cliente
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({ ok: false, message: 'Acceso denegado.' });
  }
  next();
};

module.exports = { authenticate, authorize };
