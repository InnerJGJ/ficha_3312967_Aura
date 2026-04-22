/**
 * Modelo: Cliente
 * Maneja las operaciones de base de datos para clientes
 */

import pool from '../config/db.js';

export const Cliente = {

    // Obtener todos los clientes
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM clientes ORDER BY Nombre ASC');
        return rows.map(cliente => ({
            IDCliente:    cliente.IDCliente,
            NroDocumento: cliente.NroDocumento,
            Nombre:       cliente.Nombre,
            Apellido:     cliente.Apellido,
            Direccion:    cliente.Direccion,
            Correo:       cliente.Email,
            Telefono:     cliente.Telefono,
            Estado:       cliente.Estado,
            IDRol:        cliente.IDRol
        }));
    },

    // Obtener cliente por ID
    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM clientes WHERE IDCliente = ?', [id]);
        const c = rows[0];
        if (!c) return null;
        return {
            IDCliente:    c.IDCliente,
            NroDocumento: c.NroDocumento,
            Nombre:       c.Nombre,
            Apellido:     c.Apellido,
            Direccion:    c.Direccion,
            Correo:       c.Email,
            Telefono:     c.Telefono,
            Estado:       c.Estado,
            IDRol:        c.IDRol
        };
    },

    // Crear nuevo cliente
    async create(data) {
        const { NroDocumento, Nombre, Apellido, Direccion, Correo, Telefono } = data;
        const [result] = await pool.query(
            'INSERT INTO clientes (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono) VALUES (?, ?, ?, ?, ?, ?)',
            [NroDocumento, Nombre, Apellido, Direccion ?? null, Correo, Telefono]
        );
        return { id: result.insertId, NroDocumento, Nombre, Apellido, Direccion, Correo, Telefono };
    },

    // Actualizar cliente (todos los campos)
    async update(id, data) {
        const { NroDocumento, Nombre, Apellido, Direccion, Correo, Telefono } = data;
        const [result] = await pool.query(
            'UPDATE clientes SET NroDocumento = ?, Nombre = ?, Apellido = ?, Direccion = ?, Email = ?, Telefono = ? WHERE IDCliente = ?',
            [NroDocumento, Nombre, Apellido, Direccion ?? null, Correo, Telefono, id]
        );
        return result.affectedRows > 0;
    },

    // ✅ Actualizar SOLO el estado del cliente
    async updateEstado(id, estado) {
        const [result] = await pool.query(
            'UPDATE clientes SET Estado = ? WHERE IDCliente = ?',
            [estado, id]
        );
        return result.affectedRows > 0;
    },

    // Eliminar cliente
    async delete(id) {
        const [result] = await pool.query('DELETE FROM clientes WHERE IDCliente = ?', [id]);
        return result.affectedRows > 0;
    },

    // Buscar cliente por documento
    async getByDocumento(nroDocumento) {
        const [rows] = await pool.query('SELECT * FROM clientes WHERE NroDocumento = ?', [nroDocumento]);
        return rows[0];
    }
};

export default Cliente;