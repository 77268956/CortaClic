const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes     = require('./routes/authRoutes');
const usuarioRoutes  = require('./routes/usuarioRoutes');
const barberoRoutes  = require('./routes/barberoRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const citaRoutes     = require('./routes/citaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const ventaRoutes    = require('./routes/ventaRoutes');
const testRoutes     = require('./routes/testRoutes');
const requestLogger  = require('./middlewares/requestLogger');
const notFound       = require('./middlewares/notFound');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(express.static(path.join(__dirname, 'public'), { index: false }));


// ── Páginas del módulo CLIENTE ──────────────────────────────────
const clienteDir = path.join(__dirname, 'public', 'cliente');

const clientePages = [
  { route: '/',                   file: 'index.html'         },
  { route: '/login',              file: 'login.html'         },
  { route: '/servicios',          file: 'servicios.html'     },
  { route: '/servicios/reservar', file: 'reservar.html'      },
  { route: '/tienda',             file: 'tienda.html'        },
  { route: '/carrito',            file: 'carrito.html'       },
  { route: '/mis-citas',          file: 'mis-citas.html'     },
  { route: '/perfil',             file: 'perfil.html'        },
  { route: '/auth/callback',      file: 'auth/callback.html' },
];

clientePages.forEach(({ route, file }) => {
  app.get(route, (_req, res) => {
    res.sendFile(file, { root: clienteDir });
  });
});

// ── Páginas del módulo ADMIN ────────────────────────────────────
const adminDir = path.join(__dirname, 'public', 'admin');

const adminPages = [
  { route: '/admin/dashboard', file: 'dashboard.html' },
  { route: '/admin/barberos',  file: 'barberos.html'  },
  { route: '/admin/servicios', file: 'servicios.html' },
  { route: '/admin/productos', file: 'productos.html' },
  { route: '/admin/historial', file: 'historial.html' },
];

adminPages.forEach(({ route, file }) => {
  app.get(route, (_req, res) => {
    res.sendFile(file, { root: adminDir });
  });
});

app.get('/admin/perfil', (_req, res) => {
  res.sendFile('perfil.html', { root: clienteDir });
});

// ── API ─────────────────────────────────────────────────────────
app.use('/api/test',      testRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/usuarios',  usuarioRoutes);
app.use('/api/barberos',  barberoRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/citas',     citaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/ventas',    ventaRoutes);
app.use('/api/admin',     adminRoutes);

app.use(notFound);

module.exports = app;
