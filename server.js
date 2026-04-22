const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Importar rutas
const habitacionRoutes = require('./src/routes/habitacion.routes');
const serviciosRoutes  = require('./src/routes/servicios.Routes');
const paqueteRoutes    = require('./src/routes/paquete.routes');
import clientesRoutes from './routes/clientes.routes.js';
import cabanaRoutes from './routes/cabanas.routes.js';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', clientesRoutes);
app.use('/api', cabanaRoutes);

// ← Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Rutas API
app.use('/habitaciones', habitacionRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/paquetes', paqueteRoutes);

// Cualquier ruta no-API devuelve el index.html
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Puerto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
