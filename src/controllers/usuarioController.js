const Usuario = require('../models/Usuario');

exports.getMe = async (req, res) => {
	try {
		const user = await Usuario.findById(req.user.id);

		if (!user) {
			return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
		}

		return res.status(200).json({ ok: true, user });
	} catch (err) {
		console.error('[usuarioController.getMe]', err);
		return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
	}
};
