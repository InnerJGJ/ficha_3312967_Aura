import express from 'express';
import { CabanasController } from '../controllers/cabanas.controller.js';
import { validarCabana } from '../middlewares/validation.middleware.js';
 
const router = express.Router();
 
router.get('/cabanas',                          CabanasController.getAllCabanas);
router.get('/cabanas/:IDCabana',                CabanasController.getCabanaById);
router.get('/cabanas/:IDCabana/habitaciones',   CabanasController.getHabitacionesByCabana);
router.post('/cabanas',          validarCabana, CabanasController.createCabana);
router.put('/cabanas/:IDCabana', validarCabana, CabanasController.updateCabana);
router.put('/cabanas/:IDCabana/estado',         CabanasController.updateEstadoCabana);
router.delete('/cabanas/:IDCabana',             CabanasController.deleteCabana);
 
export default router;