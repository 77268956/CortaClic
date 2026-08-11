const mysql2 = require('mysql2/promise');
const dbConfig = require('../../config/database');

const pool = mysql2.createPool(dbConfig);

/* ── GET /api/admin/productos ────────────────────────────────── */
async function getProductos(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, descripcion, categoria, imagen, precio, stock, activo FROM productos WHERE deleted_at IS NULL ORDER BY id ASC'
    );
    res.json({ ok: true, productos: rows });
  } catch (e) {
    console.error('getProductos admin:', e);
    res.status(500).json({ ok: false, message: 'Error al obtener productos.' });
  }
}

/* ── GET /api/admin/productos/:id ────────────────────────────── */
async function getProductoById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT id, nombre, descripcion, categoria, imagen, precio, stock, activo FROM productos WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });
    res.json({ ok: true, producto: rows[0] });
  } catch (e) {
    console.error('getProductoById admin:', e);
    res.status(500).json({ ok: false, message: 'Error al obtener el producto.' });
  }
}

/* ── POST /api/admin/productos ───────────────────────────────── */
async function createProducto(req, res) {
  try {
    const { nombre, descripcion, categoria, imagen, precio, stock, activo = true } = req.body;

    if (!nombre || precio === undefined || stock === undefined) {
      return res.status(400).json({ ok: false, message: 'Nombre, precio y stock son requeridos.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO productos (nombre, descripcion, categoria, imagen, precio, stock, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, descripcion || null, categoria || null, imagen || null, precio, stock, activo ? 1 : 0]
    );

    res.status(201).json({ ok: true, message: 'Producto creado exitosamente.', id: result.insertId });
  } catch (e) {
    console.error('createProducto admin:', e);
    res.status(500).json({ ok: false, message: 'Error al crear el producto.' });
  }
}

/* ── PUT /api/admin/productos/:id ────────────────────────────── */
async function updateProducto(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoria, imagen, precio, stock, activo } = req.body;

    const [check] = await pool.execute(
      'SELECT id FROM productos WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]
    );
    if (!check.length) return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });

    await pool.execute(
      'UPDATE productos SET nombre = ?, descripcion = ?, categoria = ?, imagen = ?, precio = ?, stock = ?, activo = ? WHERE id = ?',
      [nombre, descripcion || null, categoria || null, imagen || null, precio, stock, activo ? 1 : 0, id]
    );

    res.json({ ok: true, message: 'Producto actualizado exitosamente.' });
  } catch (e) {
    console.error('updateProducto admin:', e);
    res.status(500).json({ ok: false, message: 'Error al actualizar el producto.' });
  }
}

/* ── DELETE /api/admin/productos/:id ─────────────────────────── */
async function deleteProducto(req, res) {
  try {
    const { id } = req.params;
    const [check] = await pool.execute(
      'SELECT id FROM productos WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]
    );
    if (!check.length) return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });

    await pool.execute('UPDATE productos SET deleted_at = NOW() WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Producto eliminado.' });
  } catch (e) {
    console.error('deleteProducto admin:', e);
    res.status(500).json({ ok: false, message: 'Error al eliminar el producto.' });
  }
}

module.exports = { getProductos, getProductoById, createProducto, updateProducto, deleteProducto };
