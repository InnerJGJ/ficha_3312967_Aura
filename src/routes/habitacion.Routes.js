const express = require('express');
const router = express.Router();
// Actualizado con el nuevo formato Nombre.Controller
const HabitacionController = require('../controllers/Habitacion.Controller');

router.get('/', HabitacionController.getAllHabitaciones);
router.get('/:id', HabitacionController.getHabitacionById);
router.post('/', HabitacionController.createHabitacion);
router.put('/:id', HabitacionController.updateHabitacion);
router.delete('/:id', HabitacionController.deleteHabitacion);

module.exports = router;