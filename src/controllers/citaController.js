const Cita = require('../models/Cita');
const Barbero = require('../models/Barbero');
const Servicio = require('../models/Servicio');

/**
 * Helper para obtener la fecha local en formato YYYY-MM-DD
 */
function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * GET /api/citas/disponibilidad
 * Query: ?barbero_id=1&fecha=2026-08-11&servicio_id=2
 */
exports.getDisponibilidad = async (req, res) => {
  try {
    const { barbero_id, fecha, servicio_id } = req.query;

    if (!fecha) {
      return res.status(400).json({ ok: false, message: 'La fecha es requerida (YYYY-MM-DD).' });
    }

    const now = new Date();
    const todayStr = getLocalDateString(now);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    if (fecha < todayStr) {
      return res.status(400).json({ ok: false, message: 'No puedes consultar fechas pasadas.' });
    }

    // Duración del servicio
    let duracion = 30;
    if (servicio_id) {
      const servicio = await Servicio.findById(servicio_id);
      if (servicio) duracion = servicio.duracion_minutos;
    }

    // Barberos a consultar
    let listBarberos = [];
    if (barbero_id && barbero_id !== 'any' && !isNaN(barbero_id)) {
      const single = await Barbero.findById(Number(barbero_id));
      if (single) listBarberos = [single];
    }
    
    if (listBarberos.length === 0) {
      listBarberos = await Barbero.findAll();
    }

    // Obtener horarios de cada barbero para filtrar slots
    const barberoHorariosMap = {};
    for (const b of listBarberos) {
      const horarios = await Barbero.getHorarios(b.id);
      barberoHorariosMap[b.id] = horarios; // [{dia_semana, hora_inicio, hora_fin}, ...]
    }

    // Conjunto de días (1=Mon ..7=Sun) donde al menos un barbero tiene horario disponible
    const allowedDaysSet = new Set();

    if (listBarberos.length === 0) {
      return res.status(400).json({ ok: false, message: 'No hay barberos registrados en el sistema.' });
    }

    // Generar slots de horario (09:00 a 18:30)
    const startHour = 9;  // 09:00 AM
    const endHour   = 19; // 07:00 PM
    const slots = [];

    const isToday = (fecha === todayStr);

    for (let h = startHour; h < endHour; h++) {
      for (let m of [0, 30]) {
        const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const slotDateTimeStr = `${fecha} ${horaStr}:00`;

        // REGLA: Si la fecha es HOY, descartar completamente cualquier hora que ya haya transcurrido
        let slotIsPast = false;
        if (isToday) {
          if (h < currentHour || (h === currentHour && m <= currentMin)) {
            slotIsPast = true;
          }
        }

        // Determinar día de la semana en formato DB (1=Mon ..7=Sun)
        const jsDay = new Date(slotDateTimeStr).getDay(); // 0=Sun
        const dbDay = jsDay === 0 ? 7 : jsDay; // convierte a 1..7
        // Añadir día al conjunto de días permitidos (solo si hay algún horario en la DB)
        for (const b of listBarberos) {
          const horarios = barberoHorariosMap[b.id] || [];
          if (horarios.some(hor => hor.dia_semana === dbDay)) {
            allowedDaysSet.add(dbDay);
          }
        }

        let isAvailable = false;
        let assignedBarberId = null;

        if (!slotIsPast) {
          // Verificar disponibilidad entre los barberos candidatos, respetando sus horarios
          slotCheck:
          for (let b of listBarberos) {
            const horarios = barberoHorariosMap[b.id] || [];
            // Verificar si este barbero trabaja en este día y hora
            let worksNow = false;
            for (const hor of horarios) {
              if (hor.dia_semana !== dbDay) continue;
              const [hStart, mStart] = hor.hora_inicio.split(':').map(Number);
              const [hEnd, mEnd] = hor.hora_fin.split(':').map(Number);
              const startMin = hStart * 60 + mStart;
              const endMin = hEnd * 60 + mEnd;
              const slotMin = h * 60 + m;
              if (slotMin >= startMin && slotMin + duracion <= endMin) {
                worksNow = true;
                break;
              }
            }
            if (!worksNow) continue; // barbero no trabaja en este slot

            const free = await Cita.isBarberAvailable(b.id, slotDateTimeStr, duracion);
            if (free) {
              isAvailable = true;
              assignedBarberId = b.id;
              break slotCheck; // con 1 barbero libre basta
            }
          }
        }

        slots.push({
          hora: horaStr,
          disponible: isAvailable,
          barberoId: assignedBarberId
        });
      }
    }

    // Convertir el set a array para enviarlo al cliente
    const allowedDays = Array.from(allowedDaysSet);

    return res.status(200).json({ ok: true, fecha, slots, dias: allowedDays });
  } catch (err) {
    console.error('[citaController.getDisponibilidad]', err);
    return res.status(500).json({ ok: false, message: 'Error al consultar disponibilidad.' });
  }
};

/**
 * POST /api/citas
 * Body: { barbero_id, servicio_id, fecha, hora }
 */
exports.crearCita = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { barbero_id, servicio_id, fecha, hora } = req.body;

    if (!servicio_id || !fecha || !hora) {
      return res.status(400).json({ ok: false, message: 'Servicio, fecha y hora son requeridos.' });
    }

    const now = new Date();
    const todayStr = getLocalDateString(now);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    if (fecha < todayStr) {
      return res.status(400).json({ ok: false, message: 'No puedes agendar citas en fechas pasadas.' });
    }

    // Validar servicio
    const servicio = await Servicio.findById(servicio_id);
    if (!servicio) {
      return res.status(404).json({ ok: false, message: 'El servicio seleccionado no existe.' });
    }

    const fechaHoraStr = `${fecha} ${hora}:00`;

    // Si es hoy, validar estricto que la hora elegida no sea pasada
    if (fecha === todayStr) {
      const [hStr, mStr] = hora.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);

      if (h < currentHour || (h === currentHour && m <= currentMin)) {
        return res.status(400).json({ ok: false, message: 'El horario seleccionado ya ha transcurrido.' });
      }
    }

    let finalBarberoId = null;

    // Asignar barbero
    if (barbero_id && barbero_id !== 'any' && !isNaN(barbero_id)) {
      const bId = Number(barbero_id);
      const isFree = await Cita.isBarberAvailable(bId, fechaHoraStr, servicio.duracion_minutos);
      if (!isFree) {
        return res.status(409).json({ ok: false, message: 'El barbero seleccionado ya no tiene disponible ese horario.' });
      }
      finalBarberoId = bId;
    } else {
      // Buscar el primer barbero libre ("Cualquier barbero")
      const allBarberos = await Barbero.findAll();
      for (let b of allBarberos) {
        const isFree = await Cita.isBarberAvailable(b.id, fechaHoraStr, servicio.duracion_minutos);
        if (isFree) {
          finalBarberoId = b.id;
          break;
        }
      }

      if (!finalBarberoId) {
        return res.status(409).json({ ok: false, message: 'No hay barberos disponibles en el horario seleccionado.' });
      }
    }

    // Crear cita en DB
    const nuevaCita = await Cita.create({
      clienteId,
      barberoId: finalBarberoId,
      servicioId: servicio.id,
      fechaHora: fechaHoraStr
    });

    const barberoInfo = await Barbero.findById(finalBarberoId);

    return res.status(201).json({
      ok: true,
      message: '¡Cita agendada con éxito!',
      cita: {
        ...nuevaCita,
        servicioNombre: servicio.nombre,
        servicioPrecio: servicio.precio,
        barberoNombre: barberoInfo ? barberoInfo.nombre : 'Barbero Asignado',
        fecha,
        hora
      }
    });
  } catch (err) {
    console.error('[citaController.crearCita]', err);
    return res.status(500).json({ ok: false, message: 'Error interno al agendar la cita.' });
  }
};

/**
 * GET /api/citas/mis-citas
 */
exports.getMisCitas = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const citas = await Cita.findByCliente(clienteId);
    return res.status(200).json({ ok: true, citas });
  } catch (err) {
    console.error('[citaController.getMisCitas]', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener tus citas.' });
  }
};

/**
 * PATCH /api/citas/:id/cancelar
 */
exports.cancelarCita = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { id } = req.params;

    const success = await Cita.cancel(id, clienteId);
    if (!success) {
      return res.status(400).json({ ok: false, message: 'No se pudo cancelar la cita.' });
    }

    return res.status(200).json({ ok: true, message: 'Cita cancelada correctamente.' });
  } catch (err) {
    console.error('[citaController.cancelarCita]', err);
    return res.status(500).json({ ok: false, message: 'Error al cancelar la cita.' });
  }
};

/**
 * GET /api/citas/:id/ticket
 * Genera el ticket en PDF de una cita existente
 */
exports.descargarTicket = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscar la cita en la base de datos
    const cita = await Cita.findById(Number(id));
    if (!cita) {
      return res.status(404).json({ ok: false, message: 'La cita especificada no existe.' });
    }

    // 2. Traer la información complementaria (Servicio y Barbero)
    const servicio = await Servicio.findById(cita.servicioId);
    const barbero = await Barbero.findById(cita.barberoId);

    // Formatear la fecha y hora para mostrarla bonita en el ticket
    const fechaHora = new Date(cita.fechaHora);
    const fechaCita = fechaHora.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaCita = fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // 3. Estructurar los datos limpios para el pdfHelper
    const datosTicket = {
      id: cita.id,
      cliente: req.user?.nombre || 'Cliente Peluquería',
      barbero: barbero ? barbero.nombre : 'No asignado',
      servicio: servicio ? servicio.nombre : 'Servicio General',
      precio: servicio ? servicio.precio : 0,
      fecha: fechaCita,
      hora: horaCita
    };

    // 4. Generar el PDF en memoria llamando a tu utilitario
    const ticketBuffer = await generarTicketBuffer(datosTicket);

    // 5. Configurar cabeceras y responder con el documento PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=ticket_cita_${id}.pdf`);
    
    return res.end(ticketBuffer);

  } catch (err) {
    console.error('[citaController.descargarTicket]', err);
    return res.status(500).json({ ok: false, message: 'Error al generar el ticket de la cita.' });
  }
};



