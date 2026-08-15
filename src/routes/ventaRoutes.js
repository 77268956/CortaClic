const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { createVenta } = require('../controllers/ventaController');

const router = Router();

// Todas las ventas requieren que el usuario esté autenticado
router.post('/', authenticate, createVenta);

module.exports = router;
