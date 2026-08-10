const { verifyToken } = require('../config/jwt');

/**
 * Middleware: verifica Bearer token en el header Authorization.
 * Agrega req.user con el payload decodificado.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Token requerido.' });
    }
    const token = authHeader.split(' ')[1];
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
