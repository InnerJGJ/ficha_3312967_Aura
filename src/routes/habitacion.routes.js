const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const { getHabitaciones, postHabitacion, putHabitacion, deleteHabitacion, getHabitacionById } = require('../controllers/habitacion.Controller.js');

// Rutas CRUD de habitaciones
router.get('/', getHabitaciones);
router.get('/:id', getHabitacionById);
router.post('/', postHabitacion);
router.put('/:id', putHabitacion);
router.delete('/:id', deleteHabitacion);
=======
const HabitacionController = require('../controllers/HabitacionController');

// Rutas CRUD de habitaciones
router.get('/', HabitacionController.getAllHabitaciones);
router.get('/:id', HabitacionController.getHabitacionById);
router.post('/', HabitacionController.createHabitacion);
router.put('/:id', HabitacionController.updateHabitacion);
router.delete('/:id', HabitacionController.deleteHabitacion);
>>>>>>> Diego

module.exports = router;