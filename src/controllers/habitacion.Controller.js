// src/controllers/habitacion.Controller.js
const habitacionModel = require('../models/habitacion.Models');

exports.getHabitaciones = async (req, res) => {
    try {
        const habitaciones = await habitacionModel.obtenerHabitaciones();
        res.json(habitaciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.postHabitacion = async (req, res) => {
    try {
        const resultado = await habitacionModel.crearHabitacion(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.putHabitacion = async (req, res) => {
    try {
        const resultado = await habitacionModel.actualizarHabitacion(req.params.id, req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteHabitacion = async (req, res) => {
    try {
        const resultado = await habitacionModel.eliminarHabitacion(req.params.id);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getHabitacionById = async (req, res) => {
    try {
        const habitacion = await habitacionModel.obtenerHabitacionPorId(req.params.id);
        if (habitacion) {
            res.json(habitacion);
        } else {
            res.status(404).json({ error: 'Habitación no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
