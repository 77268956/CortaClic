module.exports = (req, res) => {
  res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada',
  });
};