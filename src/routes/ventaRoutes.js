const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
	res.status(200).json({
		ok: true,
		section: 'ventas',
		message: 'Ruta de ventas lista',
	});
});

module.exports = router;
