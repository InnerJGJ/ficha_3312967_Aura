const express = require('express');
const router = express.Router();
const HabitacionController = require('../controllers/HabitacionController');

// Rutas CRUD de habitaciones
router.get('/', HabitacionController.getAllHabitaciones);
router.get('/:id', HabitacionController.getHabitacionById);
router.post('/', HabitacionController.createHabitacion);
router.put('/:id', HabitacionController.updateHabitacion);
router.delete('/:id', HabitacionController.deleteHabitacion);

module.exports = router;