const mysql2 = require('mysql2/promise');
const dbConfig = require('../../config/database');
const path = require('path');
const fs = require('fs');
const Cita = require('../../models/Cita');
const Barbero = require('../../models/Barbero');
const Servicio = require('../../models/Servicio');
const { generarTicketBuffer } = require('../../utils/pdfHelper');

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

    // Si se marca como completada (3), generar y guardar el ticket PDF
    if (Number(estado) === 3) {
      try {
        const cita = await Cita.findById(Number(id));
        if (cita) {
          const servicioId = cita.servicioId ?? cita.servicio_id;
          const barberoId = cita.barberoId ?? cita.barbero_id;
          const fechaHoraValue = cita.fechaHora ?? cita.fecha_hora;

          const servicio = servicioId ? await Servicio.findById(servicioId) : null;
          const barbero = barberoId ? await Barbero.findById(barberoId) : null;

          const fechaHora = new Date(fechaHoraValue);
          const fechaCita = fechaHora.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const horaCita = fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

          // Obtener nombre del cliente
          let clienteNombre = 'Cliente';
          const [clienteRows] = await pool.execute('SELECT nombre FROM usuarios WHERE id = ?', [cita.cliente_id]);
          if (clienteRows.length > 0) clienteNombre = clienteRows[0].nombre;

          const datosTicket = {
            id: cita.id,
            cliente: clienteNombre,
            barbero: barbero ? barbero.nombre : 'No asignado',
            servicio: servicio ? servicio.nombre : 'Servicio General',
            precio: servicio ? servicio.precio : 0,
            fecha: fechaCita,
            hora: horaCita
          };

          const ticketBuffer = await generarTicketBuffer(datosTicket);

          // Guardar en disco
          const ticketsDir = path.join(__dirname, '..', '..', 'public', 'tickets');
          if (!fs.existsSync(ticketsDir)) {
            fs.mkdirSync(ticketsDir, { recursive: true });
          }

          const fileName = `ticket_cita_${id}.pdf`;
          const filePath = path.join(ticketsDir, fileName);
          fs.writeFileSync(filePath, ticketBuffer);

          // Guardar ruta en la base de datos
          const dbPath = `/tickets/${fileName}`;
          await Cita.saveTicketPath(Number(id), dbPath);
        }
      } catch (ticketErr) {
        console.error('[updateCitaStatus] Error al generar ticket:', ticketErr);
        // No falla la operación principal, solo loguea el error
      }
    }

    res.json({ ok: true, message: 'Estado actualizado.' });
  } catch (e) {
    console.error('Error al actualizar estado:', e);
    res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
}

module.exports = { crearWalkin, updateCitaStatus };
