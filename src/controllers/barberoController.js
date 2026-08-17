const Barbero = require('../models/Barbero');

/**
 * GET /api/barberos
 * Devuelve la lista de barberos activos
 */
exports.getBarberos = async (req, res) => {
  try {
    const barberosRaw = await Barbero.findAll();
    const barberos = await Promise.all(barberosRaw.map(async b => {
      const horarios = await Barbero.getHorarios(b.id);
      return { ...b, horarios };
    }));
    return res.status(200).json({ ok: true, barberos });
  } catch (err) {
    console.error('[barberoController.getBarberos]', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener la lista de barberos.' });
  }
};

/**
 * GET /api/barberos/:id
 * Devuelve el detalle de un barbero por su ID
 */
exports.getBarberoById = async (req, res) => {
  try {
    const { id } = req.params;
    const barbero = await Barbero.findById(id);
    if (!barbero) {
      return res.status(404).json({ ok: false, message: 'Barbero no encontrado.' });
    }
    const horarios = await Barbero.getHorarios(id);
    return res.status(200).json({ ok: true, barbero: { ...barbero, horarios } });
  } catch (err) {
    console.error('[barberoController.getBarberoById]', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener información del barbero.' });
  }
};
