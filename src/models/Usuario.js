const mysql2 = require('mysql2/promise');
const dbConfig = require('../config/database');

const pool = mysql2.createPool(dbConfig);

/**
 * Busca un usuario por email (solo activos).
 * @param {string} email
 * @returns {object|null}
 */
async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM usuarios WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Busca un usuario por google_id (solo activos).
 * @param {string} googleId
 * @returns {object|null}
 */
async function findByGoogleId(googleId) {
  const [rows] = await pool.execute(
    'SELECT * FROM usuarios WHERE google_id = ? AND deleted_at IS NULL LIMIT 1',
    [googleId]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Vincula un google_id a un usuario existente (por id).
 * @param {number} userId
 * @param {string} googleId
 */
async function linkGoogleId(userId, googleId) {
  await pool.execute(
    'UPDATE usuarios SET google_id = ? WHERE id = ?',
    [googleId, userId]
  );
}

/**
 * Crea un nuevo usuario cliente (rol = 2) registrado con Google.
 * @param {object} datos - { nombre, email, googleId }
 * @returns {object} { id, nombre, email, telefono, rol }
 */
async function createFromGoogle({ nombre, email, googleId }) {
  const [result] = await pool.execute(
    'INSERT INTO usuarios (nombre, email, password, google_id, rol) VALUES (?, ?, NULL, ?, 2)',
    [nombre, email, googleId]
  );
  return { id: result.insertId, nombre, email, telefono: null, rol: 2 };
}

/**
 * Crea un nuevo usuario cliente (rol = 2) con contraseña.
 * @param {object} datos - { nombre, email, telefono, hashedPassword }
 * @returns {object} { id, nombre, email, telefono, rol }
 */
async function create({ nombre, email, telefono, hashedPassword }) {
  const [result] = await pool.execute(
    'INSERT INTO usuarios (nombre, email, telefono, password, rol) VALUES (?, ?, ?, ?, 2)',
    [nombre, email, telefono || null, hashedPassword]
  );
  return { id: result.insertId, nombre, email, telefono: telefono || null, rol: 2 };
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM usuarios WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

module.exports = { findByEmail, findByGoogleId, linkGoogleId, createFromGoogle, create, findById };
