const express = require('express');
const router = express.Router();
const PaqueteController = require('../controllers/Paquete.Controller');

router.get('/', PaqueteController.getAllPaquetes);
router.get('/:id', PaqueteController.getPaqueteById);
router.post('/', PaqueteController.createPaquete);
router.put('/:id', PaqueteController.updatePaquete);
router.delete('/:id', PaqueteController.deletePaquete);

module.exports = router;