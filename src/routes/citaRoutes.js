const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
	res.status(200).json({
		ok: true,
		section: 'citas',
		message: 'Ruta de citas lista',
	});
});

module.exports = router;
