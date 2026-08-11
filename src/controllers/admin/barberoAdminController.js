const mysql2 = require('mysql2/promise');
const dbConfig = require('../../config/database');

const pool = mysql2.createPool(dbConfig);

/* ── GET /api/admin/barberos ─────────────────────────────────── */
async function getBarberos(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT
        b.id,
        b.usuario_id,
        b.especialidad,
        b.activo,
        u.nombre,
        u.email,
        u.telefono
      FROM barberos b
      INNER JOIN usuarios u ON b.usuario_id = u.id
      WHERE b.deleted_at IS NULL
      ORDER BY b.id ASC
    `);

    // Attach horarios for each
    const withHorarios = await Promise.all(rows.map(async (b) => {
      const [horarios] = await pool.execute(
        'SELECT id, dia_semana, hora_inicio, hora_fin FROM horarios_barberos WHERE barbero_id = ? ORDER BY dia_semana ASC',
        [b.id]
      );
      return { ...b, horarios };
    }));

    res.json({ ok: true, barberos: withHorarios });
  } catch (e) {
    console.error('getBarberos admin:', e);
    res.status(500).json({ ok: false, message: 'Error al obtener barberos.' });
  }
}

/* ── GET /api/admin/barberos/:id ─────────────────────────────── */
async function getBarberoById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT b.id, b.usuario_id, b.especialidad, b.activo, u.nombre, u.email, u.telefono
      FROM barberos b
      INNER JOIN usuarios u ON b.usuario_id = u.id
      WHERE b.id = ? AND b.deleted_at IS NULL LIMIT 1
    `, [id]);

    if (!rows.length) return res.status(404).json({ ok: false, message: 'Barbero no encontrado.' });

    const [horarios] = await pool.execute(
      'SELECT id, dia_semana, hora_inicio, hora_fin FROM horarios_barberos WHERE barbero_id = ? ORDER BY dia_semana ASC',
      [id]
    );

    res.json({ ok: true, barbero: { ...rows[0], horarios } });
  } catch (e) {
    console.error('getBarberoById admin:', e);
    res.status(500).json({ ok: false, message: 'Error al obtener el barbero.' });
  }
}

/* ── POST /api/admin/barberos ────────────────────────────────── */
async function createBarbero(req, res) {
  const conn = await pool.getConnection();
  try {
    const { nombre, email, telefono, especialidad, activo = true, horarios = [] } = req.body;

    if (!nombre) return res.status(400).json({ ok: false, message: 'El nombre es requerido.' });

    await conn.beginTransaction();

    // Create usuario with rol=1 (Barbero), no password required
    const [uRes] = await conn.execute(
      'INSERT INTO usuarios (nombre, email, telefono, rol) VALUES (?, ?, ?, 1)',
      [nombre, email || null, telefono || null]
    );
    const usuarioId = uRes.insertId;

    // Create barbero record
    const [bRes] = await conn.execute(
      'INSERT INTO barberos (usuario_id, especialidad, activo) VALUES (?, ?, ?)',
      [usuarioId, especialidad || null, activo ? 1 : 0]
    );
    const barberoId = bRes.insertId;

    // Insert horarios
    for (const h of horarios) {
      await conn.execute(
        'INSERT INTO horarios_barberos (barbero_id, dia_semana, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)',
        [barberoId, h.dia_semana, h.hora_inicio, h.hora_fin]
      );
    }

    await conn.commit();
    res.status(201).json({ ok: true, message: 'Barbero creado exitosamente.', id: barberoId });
  } catch (e) {
    await conn.rollback();
    console.error('createBarbero admin:', e);
    res.status(500).json({ ok: false, message: 'Error al crear el barbero.' });
  } finally {
    conn.release();
  }
}

/* ── PUT /api/admin/barberos/:id ─────────────────────────────── */
async function updateBarbero(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { nombre, email, telefono, especialidad, activo, horarios = [] } = req.body;

    // Verify barbero exists
    const [rows] = await conn.execute(
      'SELECT b.id, b.usuario_id FROM barberos b WHERE b.id = ? AND b.deleted_at IS NULL LIMIT 1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: 'Barbero no encontrado.' });

    const { usuario_id } = rows[0];

    await conn.beginTransaction();

    // Update usuario
    await conn.execute(
      'UPDATE usuarios SET nombre = ?, email = ?, telefono = ? WHERE id = ?',
      [nombre, email || null, telefono || null, usuario_id]
    );

    // Update barbero
    await conn.execute(
      'UPDATE barberos SET especialidad = ?, activo = ? WHERE id = ?',
      [especialidad || null, activo ? 1 : 0, id]
    );

    // Replace horarios
    await conn.execute('DELETE FROM horarios_barberos WHERE barbero_id = ?', [id]);
    for (const h of horarios) {
      await conn.execute(
        'INSERT INTO horarios_barberos (barbero_id, dia_semana, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)',
        [id, h.dia_semana, h.hora_inicio, h.hora_fin]
      );
    }

    await conn.commit();
    res.json({ ok: true, message: 'Barbero actualizado exitosamente.' });
  } catch (e) {
    await conn.rollback();
    console.error('updateBarbero admin:', e);
    res.status(500).json({ ok: false, message: 'Error al actualizar el barbero.' });
  } finally {
    conn.release();
  }
}

/* ── DELETE /api/admin/barberos/:id ──────────────────────────── */
async function deleteBarbero(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT id FROM barberos WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: 'Barbero no encontrado.' });

    await pool.execute('UPDATE barberos SET deleted_at = NOW() WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Barbero eliminado.' });
  } catch (e) {
    console.error('deleteBarbero admin:', e);
    res.status(500).json({ ok: false, message: 'Error al eliminar el barbero.' });
  }
}

module.exports = { getBarberos, getBarberoById, createBarbero, updateBarbero, deleteBarbero };
