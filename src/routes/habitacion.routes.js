const express = require('express');
const router = express.Router();
const controller = require('../controllers/habitacion.Controller');

// Línea 6 corregida:
router.get('/', controller.getHabitaciones); 
router.post('/', controller.postHabitacion);
router.put('/:id', controller.putHabitacion);
router.delete('/:id', controller.deleteHabitacion);

module.exports = router;