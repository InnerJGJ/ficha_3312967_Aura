const clientesService = require('../services/clientes.service');

const getAll = async (req, res, next) => {
  try {
    const clientes = await clientesService.getAll();
    res.status(200).json(clientes);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll };