const mysql2 = require('mysql2/promise');
const dbConfig = require('../../config/database');

const pool = mysql2.createPool(dbConfig);

async function crearWalkin(req, res) {
  try {
    const { cliente_nombre, servicio_id, barbero_id, fecha_hora } = req.body;

    if (!cliente_nombre || !servicio_id || !barbero_id || !fecha_hora) {
      return res.status(400).json({ ok: false, message: 'Faltan datos requeridos.' });
    }

    const [result] = await pool.execute(`
      INSERT INTO citas (cliente_id, cliente_nombre, barbero_id, servicio_id, fecha_hora, estado)
      VALUES (NULL, ?, ?, ?, ?, 1)
    `, [cliente_nombre, barbero_id, servicio_id, fecha_hora]);

    res.json({ ok: true, message: 'Cita express guardada.', citaId: result.insertId });
  } catch (e) {
    console.error('Error al crear walkin:', e);
    res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
}

async function updateCitaStatus(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 1: confirmada, 2: cancelada, 3: completada

    if (estado === undefined) {
      return res.status(400).json({ ok: false, message: 'Falta estado.' });
    }

    const [result] = await pool.execute(`
      UPDATE citas SET estado = ? WHERE id = ?
    `, [estado, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Cita no encontrada.' });
    }

    res.json({ ok: true, message: 'Estado actualizado.' });
  } catch (e) {
    console.error('Error al actualizar estado:', e);
    res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
}

module.exports = { crearWalkin, updateCitaStatus };
