const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('googleapis').Auth;
const Usuario = require('../models/Usuario');
const { signToken } = require('../config/jwt');

// ── Google OAuth Client ──────────────────────────────────────
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

// ── Helper: build user payload ───────────────────────────────
function buildPayload(user) {
  return {
    id:       user.id,
    nombre:   user.nombre,
    email:    user.email,
    telefono: user.telefono || null,
    rol:      user.rol,
  };
}

// ============================================================
// POST /api/auth/login
// Body: { email, password }
// ============================================================
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

    // Si la cuenta es solo de Google (sin contraseña)
    if (!user.password) {
      return res.status(401).json({
        ok: false,
        message: 'Esta cuenta usa Google para iniciar sesión. Usa el botón de Google.',
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    const payload = buildPayload(user);
    const token   = signToken(payload);

    return res.status(200).json({ ok: true, token, user: payload });
  } catch (err) {
    console.error('[authController.login]', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// ============================================================
// POST /api/auth/register
// Body: { nombre, email, telefono, password }
// ============================================================
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

// ============================================================
// GET /api/auth/google
// Redirige al usuario a la pantalla de consentimiento de Google
// ============================================================
exports.googleAuth = (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope:       GOOGLE_SCOPES,
    prompt:      'select_account',
  });
  return res.redirect(url);
};

// ============================================================
// GET /api/auth/google/callback
// Google redirige aquí con ?code=...
// ============================================================
exports.googleCallback = async (req, res) => {
  const { code, error } = req.query;

  // El usuario canceló o hubo error en Google
  if (error || !code) {
    return res.redirect('/login?error=google_cancelled');
  }

  try {
    // 1. Intercambiar código por tokens de Google
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // 2. Obtener información del perfil de Google
    const ticket = await googleClient.verifyIdToken({
      idToken:  tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const googlePayload = ticket.getPayload();

    const googleId = googlePayload.sub;                // ID único de Google
    const email    = googlePayload.email;
    const nombre   = googlePayload.name;

    let user;

    // 3a. ¿Ya existe un usuario con este google_id?
    user = await Usuario.findByGoogleId(googleId);

    if (!user) {
      // 3b. ¿Existe una cuenta con el mismo email?
      const existing = await Usuario.findByEmail(email);

      if (existing) {
        // Vincular google_id a la cuenta existente
        await Usuario.linkGoogleId(existing.id, googleId);
        user = existing;
      } else {
        // 3c. Crear cuenta nueva con Google
        user = await Usuario.createFromGoogle({ nombre, email, googleId });
      }
    }

    // 4. Generar JWT propio
    const payload  = buildPayload(user);
    const jwtToken = signToken(payload);

    // 5. Redirigir a la página de callback con el token en la URL
    return res.redirect(`/auth/callback?token=${encodeURIComponent(jwtToken)}`);

  } catch (err) {
    console.error('[authController.googleCallback]', err);
    return res.redirect('/login?error=google_failed');
  }
};
