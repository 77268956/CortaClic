const { Router } = require('express');
const { login, register, googleAuth, googleCallback } = require('../controllers/authController');

const router = Router();

// ── Email / Password ─────────────────────────────────────────
router.post('/login',    login);
router.post('/register', register);

// ── Google OAuth ─────────────────────────────────────────────
// Paso 1: redirigir a Google
router.get('/google', googleAuth);

// Paso 2: Google devuelve aquí con el code
router.get('/google/callback', googleCallback);

module.exports = router;
