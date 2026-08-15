const { Router } = require('express');
const { getProductosCliente } = require('../controllers/productoController');

const router = Router();

router.get('/', getProductosCliente);

module.exports = router;
