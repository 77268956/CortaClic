const mysql2 = require('mysql2/promise');
const dbConfig = require('../config/database');

const pool = mysql2.createPool(dbConfig);

async function getProductosCliente(req, res) {
  try {
    // Solo obtenemos productos activos y con stock
    const sql = `
      SELECT id, nombre, descripcion, categoria, precio, stock, imagen 
      FROM productos 
      WHERE activo = 1 AND stock > 0 AND deleted_at IS NULL
      ORDER BY categoria, nombre
    `;
    const [rows] = await pool.execute(sql);

    res.json({ ok: true, productos: rows });
  } catch (error) {
    console.error('Error al obtener productos (cliente):', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
}

module.exports = {
  getProductosCliente
};
