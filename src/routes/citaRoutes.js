const { Router } = require('express');
const { 
  getDisponibilidad, 
  crearCita, 
  getMisCitas, 
  cancelarCita,
  descargarTicket 
} = require('../controllers/citaController');
const { authenticate, authorize } = require('../middlewares/auth');
const { updateCitaStatus } = require('../controllers/admin/adminCitasController');

const router = Router();

// Disponibilidad es pública (para ver horarios libres)
router.get('/disponibilidad', getDisponibilidad);

// Rutas protegidas (requieren cliente autenticado)
router.post('/', authenticate, crearCita);
router.get('/mis-citas', authenticate, getMisCitas);
router.patch('/:id/cancelar', authenticate, cancelarCita);
router.patch('/:id/status', authenticate, authorize(0), updateCitaStatus);

//  Nueva ruta protegida para renderizar y obtener el ticket PDF
router.get('/:id/ticket', authenticate, descargarTicket);

module.exports = router;
