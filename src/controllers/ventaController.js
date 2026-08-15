const mysql2 = require('mysql2/promise');
const dbConfig = require('../config/database');

const pool = mysql2.createPool(dbConfig);

async function createVenta(req, res) {
  const { productos } = req.body; // [{ id, cantidad, precio }]
  const cliente_id = req.user.id; 

  if (!productos || productos.length === 0) {
    return res.status(400).json({ ok: false, message: 'El carrito está vacío' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let totalVenta = 0;
    
    // 1. Validar stock y calcular total
    for (const item of productos) {
      const [rows] = await connection.execute(
        'SELECT stock, precio, nombre FROM productos WHERE id = ? AND activo = 1 AND deleted_at IS NULL FOR UPDATE',
        [item.id]
      );
      
      if (rows.length === 0) {
        throw new Error(`Producto ID ${item.id} no encontrado o inactivo.`);
      }
      
      const productoDb = rows[0];
      if (productoDb.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para ${productoDb.nombre}. Disponible: ${productoDb.stock}`);
      }
      
      totalVenta += parseFloat(productoDb.precio) * item.cantidad;
    }

    // 2. Crear registro en tabla ventas
    // estado 1 = completado (pago contra-entrega o simulado exitoso)
    const [ventaResult] = await connection.execute(
      'INSERT INTO ventas (cliente_id, total, estado, creado_en) VALUES (?, ?, 1, NOW())',
      [cliente_id, totalVenta]
    );
    const venta_id = ventaResult.insertId;

    // 3. Crear detalles y descontar stock
    for (const item of productos) {
      const [prodRows] = await connection.execute('SELECT precio FROM productos WHERE id = ?', [item.id]);
      const precioUnitario = parseFloat(prodRows[0].precio);
      const subtotal = precioUnitario * item.cantidad;

      // Insertar en detalle_ventas
      await connection.execute(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio, subtotal) VALUES (?, ?, ?, ?, ?)',
        [venta_id, item.id, item.cantidad, precioUnitario, subtotal]
      );

      // Descontar stock
      await connection.execute(
        'UPDATE productos SET stock = stock - ? WHERE id = ?',
        [item.cantidad, item.id]
      );
    }

    await connection.commit();
    res.json({ ok: true, message: 'Compra realizada exitosamente', venta_id });

  } catch (error) {
    await connection.rollback();
    console.error('Error al procesar venta:', error);
    res.status(400).json({ ok: false, message: error.message || 'Error al procesar la compra' });
  } finally {
    connection.release();
  }
}

module.exports = {
  createVenta
};
