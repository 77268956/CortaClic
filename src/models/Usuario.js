const mysql2 = require('mysql2/promise');
const dbConfig = require('../config/database');

const pool = mysql2.createPool(dbConfig);

/**
 * Busca un usuario por email (solo activos).
 * @param {string} email
 * @returns {object|null} usuario o null
 */
async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM usuarios WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Crea un nuevo usuario cliente (rol = 2).
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

module.exports = { findByEmail, create };
