const express = require('express');
const router = express.Router();
// 'servicios' en plural y minúscula
const controller = require('../controllers/servicios.Controller');

router.get('/', controller.getServicios);
router.post('/', controller.postServicio);
router.put('/:id', controller.putServicio);
router.delete('/:id', controller.deleteServicio);

module.exports = router;