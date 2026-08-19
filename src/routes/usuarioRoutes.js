const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const { getMe } = require('../controllers/usuarioController');

const router = Router();

router.get('/', (req, res) => {
	res.status(200).json({
		ok: true,
		section: 'usuarios',
		message: 'Ruta de usuarios lista',
	});
});

router.get('/me', authenticate, getMe);

module.exports = router;
