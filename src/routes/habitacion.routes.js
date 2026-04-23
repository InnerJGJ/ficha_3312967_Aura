const express = require('express');
const router = express.Router();
const { getAllHabitaciones, createHabitacion, updateHabitacion, deleteHabitacion, getHabitacionById } = require('../controllers/Habitacion.controller.js');

// Rutas CRUD de habitaciones
router.get('/', getAllHabitaciones);
router.get('/:id', getHabitacionById);
router.post('/', createHabitacion);
router.put('/:id', updateHabitacion);
router.delete('/:id', deleteHabitacion);

module.exports = router;