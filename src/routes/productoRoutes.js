const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
	res.status(200).json({
		ok: true,
		section: 'productos',
		message: 'Ruta de productos lista',
	});
});

module.exports = router;
