const mysql2 = require('mysql2/promise');
const dbConfig = require('../config/database');

const pool = mysql2.createPool(dbConfig);

/**
 * Obtiene todos los barberos activos con el nombre de su usuario.
 * @returns {Array} Lista de barberos
 */
async function findAll() {
  const [rows] = await pool.execute(`
    SELECT 
      b.id,
      b.usuario_id,
      b.especialidad,
      u.nombre,
      u.email,
      u.telefono
    FROM barberos b
    INNER JOIN usuarios u ON b.usuario_id = u.id
    WHERE b.deleted_at IS NULL AND u.deleted_at IS NULL
    ORDER BY b.id ASC
  `);
  return rows;
}

/**
 * Obtiene un barbero por su ID (de la tabla barberos).
 * @param {number} id
 * @returns {object|null}
 */
async function findById(id) {
  const [rows] = await pool.execute(`
    SELECT 
      b.id,
      b.usuario_id,
      b.especialidad,
      u.nombre,
      u.email,
      u.telefono
    FROM barberos b
    INNER JOIN usuarios u ON b.usuario_id = u.id
    WHERE b.id = ? AND b.deleted_at IS NULL AND u.deleted_at IS NULL
    LIMIT 1
  `, [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Obtiene los horarios configurados de un barbero.
 * @param {number} barberoId
 * @returns {Array} Listado de horarios por día de la semana
 */
async function getHorarios(barberoId) {
  const [rows] = await pool.execute(`
    SELECT id, barbero_id, dia_semana, hora_inicio, hora_fin
    FROM horarios_barberos
    WHERE barbero_id = ?
    ORDER BY dia_semana ASC
  `, [barberoId]);
  return rows;
}

module.exports = { findAll, findById, getHorarios };
