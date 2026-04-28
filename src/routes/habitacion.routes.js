const express = require('express');
const router = express.Router();
const { getHabitaciones, postHabitacion, putHabitacion, deleteHabitacion, getHabitacionById } = require('../controllers/habitacion.Controller.js');

// Rutas CRUD de habitaciones
router.get('/', getHabitaciones);
router.get('/:id', getHabitacionById);
router.post('/', postHabitacion);
router.put('/:id', putHabitacion);
router.delete('/:id', deleteHabitacion);

module.exports = router;