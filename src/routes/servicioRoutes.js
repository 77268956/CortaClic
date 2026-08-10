const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
	res.status(200).json({
		ok: true,
		section: 'servicios',
		message: 'Ruta de servicios lista',
	});
});

module.exports = router;
