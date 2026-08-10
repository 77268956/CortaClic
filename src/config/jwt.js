const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'MiClaveSuperSecreta';
const EXPIRES_IN = '7d';

/**
 * Firma un token JWT con el payload dado.
 * @param {object} payload
 * @returns {string} token
 */
const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

/**
 * Verifica y decodifica un token JWT.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => jwt.verify(token, SECRET);

module.exports = { signToken, verifyToken };
