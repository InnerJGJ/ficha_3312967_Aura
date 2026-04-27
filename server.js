const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Importar rutas
const habitacionRoutes = require('./src/routes/habitacion.routes');
const serviciosRoutes  = require('./src/routes/servicios.Routes');
const paqueteRoutes    = require('./src/routes/paquete.routes');

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend'), { index: false }));

// Rutas API
app.use('/habitaciones', habitacionRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/paquetes', paqueteRoutes);

// Raíz → landing.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'landing.html'));
});

// Cualquier otra ruta → index.html
app.get('/{*path}', (req, res) => {
res.sendFile(path.join(__dirname, 'frontend', 'landing.html'));
});

// Puerto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
