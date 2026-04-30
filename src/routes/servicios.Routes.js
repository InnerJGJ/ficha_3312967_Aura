const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const { getServicios, postServicio, putServicio, deleteServicio } = require('../controllers/servicios.Controller.js');

// Rutas CRUD de servicios
router.get('/', getServicios);
router.post('/', postServicio);
router.put('/:id', putServicio);
router.delete('/:id', deleteServicio);
=======
const controller = require('../controllers/serviciosController');

// Usar '/' porque el prefijo '/api/servicios' ya lo da app.js
router.get('/', controller.getServicios);
router.post('/', controller.postServicio);
router.put('/:id', controller.putServicio);
router.delete('/:id', controller.deleteServicio);
>>>>>>> Diego

module.exports = router;