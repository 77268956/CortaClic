const mysql2 = require('mysql2/promise');
const dbConfig = require('../config/database');

const pool = mysql2.createPool(dbConfig);

/**
 * Obtiene todos los servicios activos (sin deleted_at).
 * @returns {Array} Lista de servicios
 */
async function findAll() {
  const [rows] = await pool.execute(
    'SELECT id, nombre, descripcion, precio, duracion_minutos, imagen, creado_en FROM servicios WHERE deleted_at IS NULL ORDER BY id ASC'
  );
  return rows;
}

/**
 * Obtiene un servicio por su ID (solo activo).
 * @param {number} id
 * @returns {object|null} Servicio o null
 */
async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, nombre, descripcion, precio, duracion_minutos, imagen, creado_en FROM servicios WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

module.exports = { findAll, findById };
