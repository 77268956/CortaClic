const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const { signToken } = require('../config/jwt');

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email y contraseña son requeridos.' });
    }

    const user = await Usuario.findByEmail(email);
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    const payload = { id: user.id, nombre: user.nombre, email: user.email, telefono: user.telefono, rol: user.rol };
    const token = signToken(payload);

    return res.status(200).json({ ok: true, token, user: payload });
  } catch (err) {
    console.error('[authController.login]', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

/**
 * POST /api/auth/register
 * Body: { nombre, email, telefono, password }
 */
exports.register = async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Nombre, email y contraseña son requeridos.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const existing = await Usuario.findByEmail(email);
    if (existing) {
      return res.status(409).json({ ok: false, message: 'El email ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await Usuario.create({ nombre, email, telefono, hashedPassword });

    const token = signToken(newUser);

    return res.status(201).json({ ok: true, token, user: newUser });
  } catch (err) {
    console.error('[authController.register]', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};
