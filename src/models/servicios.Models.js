<<<<<<< HEAD
const db = require('../config/db.js');

const obtenerServicios = async () => {
=======
const db = require('../config/db');

exports.obtenerServicios = async () => {
>>>>>>> Diego
    const [rows] = await db.query("SELECT * FROM servicios");
    return rows;
};

<<<<<<< HEAD
const crearServicio = async (servicio) => {
=======
exports.crearServicio = async (servicio) => {
>>>>>>> Diego
    const { nombre, precio, Descripcion, Estado, imagen } = servicio;

    const [result] = await db.query(
        "INSERT INTO servicios (nombre, precio, Descripcion, Estado, imagen) VALUES (?, ?, ?, ?, ?)",
        [nombre, precio, Descripcion, Estado, imagen]
    );

    return result;
};

<<<<<<< HEAD
const actualizarServicio = async (id, servicio) => {
=======
exports.actualizarServicio = async (id, servicio) => {
>>>>>>> Diego
    const { nombre, precio, Descripcion, Estado, imagen } = servicio;

    const [result] = await db.query(
        "UPDATE servicios SET nombre=?, precio=?, Descripcion=?, Estado=?, imagen=? WHERE IDServicio=?",
        [nombre, precio, Descripcion, Estado, imagen, id]
    );

    return result;
};

<<<<<<< HEAD
const eliminarServicio = async (id) => {
=======
exports.eliminarServicio = async (id) => {
>>>>>>> Diego
    const [result] = await db.query(
        "DELETE FROM servicios WHERE IDServicio=?",
        [id]
    );

    return result;
<<<<<<< HEAD
};

module.exports = {
    obtenerServicios,
    crearServicio,
    actualizarServicio,
    eliminarServicio
=======
>>>>>>> Diego
};