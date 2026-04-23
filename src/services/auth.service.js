const db = require('../config/db');

const login = (Email, Contrasena) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM usuarios WHERE Email = ? AND Contrasena = ?';
    db.query(sql, [Email, Contrasena], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

const register = (data) => {
  return new Promise((resolve, reject) => {
    const { NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion } = data;

    // 1. Insertar en usuarios
    const sqlUsuario = `INSERT INTO usuarios 
      (NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sqlUsuario, [NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, 1],
      (err, result) => {
        if (err) return reject(err);

        // 2. Insertar en clientes con el mismo NumeroDocumento
        const sqlCliente = `INSERT INTO clientes 
          (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(sqlCliente, [NumeroDocumento, NombreUsuario, Apellido, Direccion, Email, Telefono, 1, 1],
          (err) => {
            if (err) return reject(err);
            resolve({ id: result.insertId });
          });
      });
  });
};

module.exports = { login, register };