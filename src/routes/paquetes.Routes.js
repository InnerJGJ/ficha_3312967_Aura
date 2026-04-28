const express = require('express');
const router = express.Router();
// IMPORTANTE: 'paquete' en singular y minúscula para coincidir con tu nueva imagen
const controller = require('../controllers/paquete.Controller'); 

router.get('/', controller.getAllPaquetes);
router.get('/:id', controller.getPaqueteById);
router.post('/', controller.createPaquete);
router.put('/:id', controller.updatePaquete);
router.delete('/:id', controller.deletePaquete);

module.exports = router;