const { obtenerServicios, crearServicio, actualizarServicio, eliminarServicio } = require('../models/servicios.Models.js');

const getServicios = async (req, res) => {
    try {
        const servicios = await obtenerServicios();
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const postServicio = async (req, res) => {
    try {
        const resultado = await crearServicio(req.body);
        res.json(resultado);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({ message: "¡Error! Este servicio ya se encuentra registrado." });
        }
        res.status(500).json({ error: error.message });
    }
};

const putServicio = async (req, res) => {
    try {
        const id = req.params.id;
        const resultado = await actualizarServicio(id, req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteServicio = async (req, res) => {
    try {
        const id = req.params.id;
        const resultado = await eliminarServicio(id);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getServicios,
    postServicio,
    putServicio,
    deleteServicio
};