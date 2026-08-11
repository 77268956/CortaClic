const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middlewares/auth');

const barberoAdmin  = require('../controllers/admin/barberoAdminController');
const servicioAdmin = require('../controllers/admin/servicioAdminController');
const productoAdmin = require('../controllers/admin/productoAdminController');
const historial     = require('../controllers/admin/historialController');
const adminCitas    = require('../controllers/admin/adminCitasController');

// All admin routes require authentication and rol=0 (Admin)
router.use(authenticate, authorize(0));

/* ── Barberos ──────────────────────────────────────── */
router.get('/barberos',        barberoAdmin.getBarberos);
router.get('/barberos/:id',    barberoAdmin.getBarberoById);
router.post('/barberos',       barberoAdmin.createBarbero);
router.put('/barberos/:id',    barberoAdmin.updateBarbero);
router.delete('/barberos/:id', barberoAdmin.deleteBarbero);

/* ── Servicios ─────────────────────────────────────── */
router.get('/servicios',        servicioAdmin.getServicios);
router.get('/servicios/:id',    servicioAdmin.getServicioById);
router.post('/servicios',       servicioAdmin.createServicio);
router.put('/servicios/:id',    servicioAdmin.updateServicio);
router.delete('/servicios/:id', servicioAdmin.deleteServicio);

/* ── Productos ─────────────────────────────────────── */
router.get('/productos',        productoAdmin.getProductos);
router.get('/productos/:id',    productoAdmin.getProductoById);
router.post('/productos',       productoAdmin.createProducto);
router.put('/productos/:id',    productoAdmin.updateProducto);
router.delete('/productos/:id', productoAdmin.deleteProducto);

/* ── Historial y Citas ─────────────────────────────────────── */
router.get('/historial', historial.getHistorial);
router.post('/citas/walkin', adminCitas.crearWalkin);
router.patch('/citas/:id/estado', adminCitas.updateCitaStatus);

module.exports = router;
