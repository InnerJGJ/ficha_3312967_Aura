const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const { getAllPaquetes, getPaqueteById, createPaquete, updatePaquete, deletePaquete } = require('../controllers/Paquete.Controller.js');

// Rutas CRUD de paquetes
router.get('/', getAllPaquetes);
router.get('/:id', getPaqueteById);
router.post('/', createPaquete);
router.put('/:id', updatePaquete);
router.delete('/:id', deletePaquete);
=======
const PaqueteController = require('../controllers/PaqueteController');

router.get('/', PaqueteController.getAllPaquetes);
router.get('/:id', PaqueteController.getPaqueteById);
router.post('/', PaqueteController.createPaquete);
router.put('/:id', PaqueteController.updatePaquete);
router.delete('/:id', PaqueteController.deletePaquete);
>>>>>>> Diego

module.exports = router;