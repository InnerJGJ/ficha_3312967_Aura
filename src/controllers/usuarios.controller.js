const usuariosService = require('../services/usuarios.service');

const getAll = async (req, res, next) => {
  try {
    const usuarios = await usuariosService.getAll();
    res.status(200).json(usuarios);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll };