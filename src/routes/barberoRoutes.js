const { Router } = require('express');
const { getBarberos, getBarberoById } = require('../controllers/barberoController');

const router = Router();

router.get('/', getBarberos);
router.get('/:id', getBarberoById);

module.exports = router;
