const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Importar rutas
const habitacionRoutes = require('./src/routes/habitacion.routes.js');
const serviciosRoutes = require('./src/routes/servicios.Routes.js');
const paqueteRoutes = require('./src/routes/paquete.routes.js');
const clientesRoutes = require('./src/routes/clientes.routes.js');
const cabanaRoutes = require('./src/routes/cabanas.routes.js');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/clientes', clientesRoutes);
app.use('/api/cabanas', cabanaRoutes);

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Rutas API
app.use('/habitaciones', habitacionRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/paquetes', paqueteRoutes);

// Cualquier ruta no-API devuelve el index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Puerto
const db = require('./src/config/db.js');
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    const connection = await db.getConnection();
    connection.release();
    console.log(`Conexión a la base de datos '${process.env.DB_NAME || 'aura_travel'}' establecida.`);
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};

startServer();
