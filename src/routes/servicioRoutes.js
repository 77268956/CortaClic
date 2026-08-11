const { Router } = require('express');
const { getServicios, getServicioById } = require('../controllers/servicioController');

const router = Router();

router.get('/', getServicios);
router.get('/:id', getServicioById);

module.exports = router;
