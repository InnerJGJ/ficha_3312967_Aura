const db = require('../config/db');

const login = async (Email, Contrasena) => {
  try {
    const sql = 'SELECT * FROM usuarios WHERE Email = ? AND Contrasena = ?';
    const [results] = await db.query(sql, [Email, Contrasena]);
    return results[0];
  } catch (error) {
    throw error;
  }
};

const register = async (data) => {
  const connection = await db.getConnection();
  try {
    const { NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion } = data;

    await connection.beginTransaction();

    // 1. Insertar en usuarios
    const sqlUsuario = `INSERT INTO usuarios 
      (NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await connection.query(sqlUsuario, [NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, 1]);

    // 2. Insertar en clientes con el mismo NumeroDocumento
    const sqlCliente = `INSERT INTO clientes 
      (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    await connection.query(sqlCliente, [NumeroDocumento, NombreUsuario, Apellido, Direccion, Email, Telefono, 1, 1]);
    
    await connection.commit();
    return { id: result.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { login, register };