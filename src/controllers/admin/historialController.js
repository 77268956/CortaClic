const mysql2 = require('mysql2/promise');
const dbConfig = require('../../config/database');

const pool = mysql2.createPool(dbConfig);

/* ── GET /api/admin/historial ────────────────────────────────── */
async function getHistorial(req, res) {
  try {
    const { desde, hasta, estado } = req.query;

    let sql = `
      SELECT
        c.id,
        c.fecha_hora,
        c.estado,
        c.barbero_id,
        COALESCE(u.nombre, c.cliente_nombre) AS cliente_nombre,
        s.nombre  AS servicio_nombre,
        s.precio  AS servicio_precio,
        ub.nombre AS barbero_nombre
      FROM citas c
      LEFT JOIN usuarios u  ON c.cliente_id  = u.id
      LEFT JOIN servicios s ON c.servicio_id = s.id
      LEFT JOIN barberos b  ON c.barbero_id  = b.id
      LEFT JOIN usuarios ub ON b.usuario_id  = ub.id
      WHERE c.deleted_at IS NULL
    `;

    const params = [];

    if (desde) {
      sql += ' AND DATE(c.fecha_hora) >= ?';
      params.push(desde);
    }
    if (hasta) {
      sql += ' AND DATE(c.fecha_hora) <= ?';
      params.push(hasta);
    }
    if (estado !== undefined && estado !== '') {
      sql += ' AND c.estado = ?';
      params.push(parseInt(estado));
    }

    sql += ' ORDER BY c.fecha_hora DESC LIMIT 200';

    const [rows] = await pool.execute(sql, params);
    res.json({ ok: true, citas: rows });
  } catch (e) {
    console.error('getHistorial admin:', e);
    res.status(500).json({ ok: false, message: 'Error al obtener el historial.' });
  }
}

module.exports = { getHistorial };
