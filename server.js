const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Importar rutas
const habitacionRoutes     = require('./src/routes/habitacion.routes');
const serviciosRoutes      = require('./src/routes/servicios.Routes');
const paqueteRoutes        = require('./src/routes/paquete.routes');
const authRoutes           = require('./src/routes/auth.routes');
const reservationRoutes    = require('./src/routes/reservation.routes');
const metodoPagoRoutes     = require('./src/routes/metodopago.routes');
const estadosReservaRoutes = require('./src/routes/estadosreserva.routes');
const usuariosRoutes       = require('./src/routes/usuarios.routes');

// Middleware
app.use(cors());
app.use(express.json());

// Rutas API (ANTES de archivos estáticos)
app.use('/api/habitaciones', habitacionRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/paquetes', paqueteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/metodopago', metodoPagoRoutes);
app.use('/api/estadosreserva', estadosReservaRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Servir archivos estáticos del frontend (DESPUÉS de las rutas API)
app.use(express.static(path.join(__dirname, 'frontend')));

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(statusCode).json({ message, error: process.env.NODE_ENV === 'development' ? err : {} });
});

// Puerto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});