const { Router } = require('express');
const { 
  getDisponibilidad, 
  crearCita, 
  getMisCitas, 
  cancelarCita,
  descargarTicket 
} = require('../controllers/citaController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

// Disponibilidad es pública (para ver horarios libres)
router.get('/disponibilidad', getDisponibilidad);

// Rutas protegidas (requieren cliente autenticado)
router.post('/', authenticate, crearCita);
router.get('/mis-citas', authenticate, getMisCitas);
router.patch('/:id/cancelar', authenticate, cancelarCita);

//  2. Nueva ruta protegida para renderizar y obtener el ticket PDF
router.get('/:id/ticket', authenticate, descargarTicket);

module.exports = router;
