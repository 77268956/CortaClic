const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Servidor de prueba funcionando',
  });
});

router.get('/error', (req, res) => {
  res.status(500).json({
    ok: false,
    message: 'Error de prueba :)',
  });
});

module.exports = router;