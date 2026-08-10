const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
	res.status(200).json({
		ok: true,
		section: 'usuarios',
		message: 'Ruta de usuarios lista',
	});
});

module.exports = router;
