import express from 'express';
import { ClientesController } from '../controllers/clientes.controller.js';
import { validarCliente } from '../middlewares/validation.middleware.js';

const router = express.Router();

router.post('/clientes', validarCliente, ClientesController.createCliente);
router.get('/clientes', ClientesController.getAllClientes);
router.get('/clientes/:IDCliente', ClientesController.getClienteById);
router.put('/clientes/:IDCliente', validarCliente, ClientesController.updateCliente);
router.put('/clientes/:IDCliente/estado', ClientesController.updateEstadoCliente);
router.delete('/clientes/:IDCliente', ClientesController.deleteCliente);

export default router;

