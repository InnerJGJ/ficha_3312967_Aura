const db = require('../config/db'); // Esto usa tu conexión de MySQL

exports.obtenerHabitaciones = async () => {
    try {
        const [rows] = await db.query("SELECT * FROM habitacion ORDER BY NombreHabitacion ASC");
        return rows;
    } catch (error) {
        throw error;
    }
};

exports.crearHabitacion = async (habitacion) => {
    const { NombreHabitacion, precio, descripcion, imagen } = habitacion;
    try {
        const [result] = await db.query(
            "INSERT INTO habitacion (NombreHabitacion, Costo, Descripcion, imagen) VALUES (?, ?, ?, ?)",
            [NombreHabitacion, precio, descripcion, imagen]
        );
        return result;
    } catch (error) {
        throw error;
    }
};

exports.actualizarHabitacion = async (id, habitacion) => {
    const { NombreHabitacion, precio, descripcion, imagen } = habitacion;
    try {
        const [result] = await db.query(
            "UPDATE habitacion SET NombreHabitacion=?, Costo=?, Descripcion=?, imagen=? WHERE IDHabitacion=?",
            [NombreHabitacion, precio, descripcion, imagen, id]
        );
        return result;
    } catch (error) {
        throw error;
    }
};

exports.eliminarHabitacion = async (id) => {
    try {
        const [result] = await db.query("DELETE FROM habitacion WHERE IDHabitacion=?", [id]);
        return result;
    } catch (error) {
        throw error;
    }
};

exports.obtenerHabitacionPorId = async (id) => {
    try {
        const [rows] = await db.query("SELECT * FROM habitacion WHERE IDHabitacion=?", [id]);
        return rows[0];
    } catch (error) {
        throw error;
    }
};