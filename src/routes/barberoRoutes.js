const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
	res.status(200).json({
		ok: true,
		section: 'barberos',
		message: 'Ruta de barberos lista',
	});
});

module.exports = router;
