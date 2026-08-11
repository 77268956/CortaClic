const Servicio = require('../models/Servicio');

/**
 * GET /api/servicios
 * Obtiene la lista de todos los servicios disponibles
 */
exports.getServicios = async (req, res) => {
  try {
    const servicios = await Servicio.findAll();
    return res.status(200).json({ ok: true, servicios });
  } catch (err) {
    console.error('[servicioController.getServicios]', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener los servicios.' });
  }
};

/**
 * GET /api/servicios/:id
 * Obtiene el detalle de un servicio por ID
 */
exports.getServicioById = async (req, res) => {
  try {
    const { id } = req.params;
    const servicio = await Servicio.findById(id);
    if (!servicio) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado.' });
    }
    return res.status(200).json({ ok: true, servicio });
  } catch (err) {
    console.error('[servicioController.getServicioById]', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener el servicio.' });
  }
};
