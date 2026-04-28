const db = require('../config/db'); // Esto usa tu conexión de MySQL

exports.obtenerHabitaciones = async () => {
    try {
        const [rows] = await db.query("SELECT * FROM habitaciones");
        return rows;
    } catch (error) {
        throw error;
    }
};

exports.crearHabitacion = async (habitacion) => {
    const { nombre, precio, descripcion, imagen } = habitacion;
    try {
        const [result] = await db.query(
            "INSERT INTO habitaciones (nombre, precio, descripcion, imagen) VALUES (?, ?, ?, ?)",
            [nombre, precio, descripcion, imagen]
        );
        return result;
    } catch (error) {
        throw error;
    }
};

exports.actualizarHabitacion = async (id, habitacion) => {
    const { nombre, precio, descripcion, imagen } = habitacion;
    try {
        const [result] = await db.query(
            "UPDATE habitaciones SET nombre=?, precio=?, descripcion=?, imagen=? WHERE id=?",
            [nombre, precio, descripcion, imagen, id]
        );
        return result;
    } catch (error) {
        throw error;
    }
};

exports.eliminarHabitacion = async (id) => {
    try {
        const [result] = await db.query("DELETE FROM habitaciones WHERE id=?", [id]);
        return result;
    } catch (error) {
        throw error;
    }
};