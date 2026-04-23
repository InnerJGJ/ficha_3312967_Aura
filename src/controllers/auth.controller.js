const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { Email, Contrasena } = req.body;

    if (!Email || !Contrasena) {
      return res.status(400).json({ message: 'Email y Contrasena son requeridos' });
    }

    const user = await authService.login(Email, Contrasena);

    if (!user) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }

    res.status(200).json({ message: 'Login exitoso', user });

  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion } = req.body;

    if (!NombreUsuario || !Contrasena || !Email) {
      return res.status(400).json({ message: 'NombreUsuario, Email y Contrasena son requeridos' });
    }

    await authService.register({ NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion });

    res.status(201).json({ message: 'Usuario registrado exitosamente' });

  } catch (error) {
    next(error);
  }
};

module.exports = { login, register };