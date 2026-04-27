const express = require('express');
const app = express();

// Importar rutas
const serviciosRoutes = require('./routes/serviciosRoutes'); // ruta correcta
// const habitacionRoutes = require('./routes/habitacionRoutes');  <-- si quieres agregar habitacion

app.use(express.json()); // necesario para leer JSON en POST/PUT

// Prefijo '/api/servicios' + rutas definidas con '/' en serviciosRoutes.js
app.use('/api/servicios', serviciosRoutes);

// Si también quieres habitacion, usa otra línea como:
// app.use('/api/habitacion', habitacionRoutes);

app.listen(3001, () => console.log('Servidor corriendo en puerto 3001'));