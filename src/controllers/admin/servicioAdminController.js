const mysql2 = require('mysql2/promise');
const dbConfig = require('../../config/database');

const pool = mysql2.createPool(dbConfig);

/* ── GET /api/admin/servicios ────────────────────────────────── */
async function getServicios(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, descripcion, precio, duracion_minutos, imagen, activo, creado_en FROM servicios WHERE deleted_at IS NULL ORDER BY id ASC'
    );
    res.json({ ok: true, servicios: rows });
  } catch (e) {
    console.error('getServicios admin:', e);
    res.status(500).json({ ok: false, message: 'Error al obtener servicios.' });
  }
}

/* ── GET /api/admin/servicios/:id ────────────────────────────── */
async function getServicioById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT id, nombre, descripcion, precio, duracion_minutos, imagen, activo FROM servicios WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: 'Servicio no encontrado.' });
    res.json({ ok: true, servicio: rows[0] });
  } catch (e) {
    console.error('getServicioById admin:', e);
    res.status(500).json({ ok: false, message: 'Error al obtener el servicio.' });
  }
}

/* ── POST /api/admin/servicios ───────────────────────────────── */
async function createServicio(req, res) {
  try {
    const { nombre, descripcion, imagen, precio, duracion_minutos, activo = true } = req.body;

    if (!nombre || precio === undefined || !duracion_minutos) {
      return res.status(400).json({ ok: false, message: 'Nombre, precio y duración son requeridos.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO servicios (nombre, descripcion, imagen, precio, duracion_minutos, activo) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, descripcion || null, imagen || null, precio, duracion_minutos, activo ? 1 : 0]
    );

    res.status(201).json({ ok: true, message: 'Servicio creado exitosamente.', id: result.insertId });
  } catch (e) {
    console.error('createServicio admin:', e);
    res.status(500).json({ ok: false, message: 'Error al crear el servicio.' });
  }
}

/* ── PUT /api/admin/servicios/:id ────────────────────────────── */
async function updateServicio(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, imagen, precio, duracion_minutos, activo } = req.body;

    const [check] = await pool.execute(
      'SELECT id FROM servicios WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]
    );
    if (!check.length) return res.status(404).json({ ok: false, message: 'Servicio no encontrado.' });

    await pool.execute(
      'UPDATE servicios SET nombre = ?, descripcion = ?, imagen = ?, precio = ?, duracion_minutos = ?, activo = ? WHERE id = ?',
      [nombre, descripcion || null, imagen || null, precio, duracion_minutos, activo ? 1 : 0, id]
    );

    res.json({ ok: true, message: 'Servicio actualizado exitosamente.' });
  } catch (e) {
    console.error('updateServicio admin:', e);
    res.status(500).json({ ok: false, message: 'Error al actualizar el servicio.' });
  }
}

/* ── DELETE /api/admin/servicios/:id ─────────────────────────── */
async function deleteServicio(req, res) {
  try {
    const { id } = req.params;
    const [check] = await pool.execute(
      'SELECT id FROM servicios WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]
    );
    if (!check.length) return res.status(404).json({ ok: false, message: 'Servicio no encontrado.' });

    await pool.execute('UPDATE servicios SET deleted_at = NOW() WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Servicio eliminado.' });
  } catch (e) {
    console.error('deleteServicio admin:', e);
    res.status(500).json({ ok: false, message: 'Error al eliminar el servicio.' });
  }
}

module.exports = { getServicios, getServicioById, createServicio, updateServicio, deleteServicio };
