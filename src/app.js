const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const barberoRoutes = require('./routes/barberoRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const citaRoutes = require('./routes/citaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const testRoutes = require('./routes/testRoutes');
const requestLogger = require('./middlewares/requestLogger');
const notFound = require('./middlewares/notFound');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(express.static(path.join(__dirname, 'public')));

// ── Páginas estáticas del cliente ──────────────────────────────
const clientePages = [
  { route: '/',                file: 'index.html'    },
  { route: '/login',           file: 'login.html'    },
  { route: '/servicios',       file: 'servicios.html'},
  { route: '/servicios/reservar', file: 'reservar.html' },
  { route: '/tienda',          file: 'tienda.html'   },
  { route: '/carrito',         file: 'carrito.html'  },
  { route: '/mis-citas',       file: 'mis-citas.html'},
  { route: '/perfil',          file: 'perfil.html'   },
];

clientePages.forEach(({ route, file }) => {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', file));
  });
});

// ── API ────────────────────────────────────────────────────────
app.use('/api/test',     testRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/barberos', barberoRoutes);
app.use('/api/servicios',servicioRoutes);
app.use('/api/citas',    citaRoutes);
app.use('/api/productos',productoRoutes);
app.use('/api/ventas',   ventaRoutes);

app.use(notFound);

module.exports = app;
