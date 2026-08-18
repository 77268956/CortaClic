const mysql2 = require('mysql2/promise');
const dbConfig = require('../config/database');

const pool = mysql2.createPool(dbConfig);

/**
 * Crea una nueva cita.
 * @param {object} datos - { clienteId, barberoId, servicioId, fechaHora }
 * @returns {object} Cita creada
 */
async function create({ clienteId, barberoId, servicioId, fechaHora }) {
  const [result] = await pool.execute(`
    INSERT INTO citas (cliente_id, barbero_id, servicio_id, fecha_hora, estado)
    VALUES (?, ?, ?, ?, 0)
  `, [clienteId, barberoId, servicioId, fechaHora]);

  return {
    id: result.insertId,
    clienteId,
    barberoId,
    servicioId,
    fechaHora,
    estado: 0
  };
}

/**
 * Obtiene todas las citas activas de una fecha dada (opcionalmente filtrado por barbero).
 * @param {string} fecha YYYY-MM-DD
 * @param {number|null} barberoId
 * @returns {Array} Listado de citas
 */
async function findAppointmentsByDate(fecha, barberoId = null) {
  let query = `
    SELECT id, cliente_id, barbero_id, servicio_id, fecha_hora, estado
    FROM citas
    WHERE DATE(fecha_hora) = ? AND estado != 2 AND deleted_at IS NULL
  `;
  const params = [fecha];

  if (barberoId) {
    query += ` AND barbero_id = ?`;
    params.push(barberoId);
  }

  const [rows] = await pool.execute(query, params);
  return rows;
}

/**
 * Obtiene todas las citas de un cliente con detalles de servicio y barbero.
 * @param {number} clienteId
 * @returns {Array} Listado de citas completas
 */
async function findByCliente(clienteId) {
  const [rows] = await pool.execute(`
    SELECT 
      c.id,
      c.cliente_id,
      c.barbero_id,
      c.servicio_id,
      c.fecha_hora,
      c.estado,
      c.ticket_path,
      c.creado_en,
      s.nombre AS servicio_nombre,
      s.precio AS servicio_precio,
      s.duracion_minutos,
      s.imagen AS servicio_imagen,
      u.nombre AS barbero_nombre,
      b.especialidad AS barbero_especialidad
    FROM citas c
    INNER JOIN servicios s ON c.servicio_id = s.id
    INNER JOIN barberos b ON c.barbero_id = b.id
    INNER JOIN usuarios u ON b.usuario_id = u.id
    WHERE c.cliente_id = ? AND c.deleted_at IS NULL
    ORDER BY c.fecha_hora DESC
  `, [clienteId]);

  return rows;
}

/**
 * Cancela una cita cambiando su estado a 2 (Cancelada).
 * @param {number} id
 * @param {number} clienteId
 * @returns {boolean} true si se actualizó
 */
async function cancel(id, clienteId) {
  const [result] = await pool.execute(`
    UPDATE citas
    SET estado = 2
    WHERE id = ? AND cliente_id = ? AND estado IN (0, 1)
  `, [id, clienteId]);

  return result.affectedRows > 0;
}

/**
 * Obtiene una cita por su ID.
 * @param {number} id
 * @returns {object|null}
 */
async function findById(id) {
  const [rows] = await pool.execute(`
    SELECT id, cliente_id, barbero_id, servicio_id, fecha_hora, estado, ticket_path, creado_en
    FROM citas
    WHERE id = ? AND deleted_at IS NULL
    LIMIT 1
  `, [id]);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    ...row,
    clienteId: row.cliente_id,
    barberoId: row.barbero_id,
    servicioId: row.servicio_id,
    fechaHora: row.fecha_hora
  };
}

/**
 * Verifica si un barbero tiene empalme de citas en un rango de tiempo.
 * @param {number} barberoId
 * @param {string} fechaHoraInicio YYYY-MM-DD HH:mm:ss
 * @param {number} duracionMinutos
 * @returns {boolean} true si está disponible, false si está ocupado
 */
async function isBarberAvailable(barberoId, fechaHoraInicio, duracionMinutos) {
  const [rows] = await pool.execute(`
    SELECT c.id, c.fecha_hora, s.duracion_minutos
    FROM citas c
    INNER JOIN servicios s ON c.servicio_id = s.id
    WHERE c.barbero_id = ? 
      AND c.estado != 2 
      AND c.deleted_at IS NULL
      AND (
        (c.fecha_hora <= ? AND DATE_ADD(c.fecha_hora, INTERVAL s.duracion_minutos MINUTE) > ?)
        OR
        (c.fecha_hora < DATE_ADD(?, INTERVAL ? MINUTE) AND c.fecha_hora >= ?)
      )
    LIMIT 1
  `, [barberoId, fechaHoraInicio, fechaHoraInicio, fechaHoraInicio, duracionMinutos, fechaHoraInicio]);

  return rows.length === 0;
}

/**
 * Guarda la ruta del ticket PDF generado en la cita.
 * @param {number} citaId
 * @param {string} ticketPath
 */
async function saveTicketPath(citaId, ticketPath) {
  await pool.execute(
    'UPDATE citas SET ticket_path = ? WHERE id = ?',
    [ticketPath, citaId]
  );
}

module.exports = {
  create,
  findAppointmentsByDate,
  findByCliente,
  cancel,
  findById,
  isBarberAvailable,
  saveTicketPath
};
