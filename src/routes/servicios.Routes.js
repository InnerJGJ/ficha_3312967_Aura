const express = require('express');
const router = express.Router();
const controller = require('../controllers/Servicios.Controller');

// Usar '/' porque el prefijo '/api/servicios' ya lo da app.js
router.get('/', controller.getServicios);
router.post('/', controller.postServicio);
router.put('/:id', controller.putServicio);
router.delete('/:id', controller.deleteServicio);

module.exports = router;