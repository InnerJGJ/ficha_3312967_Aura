const serviciosModel = require('../models/servicios.Models');

exports.getServicios = async (req, res) => {
    try {
        const servicios = await serviciosModel.obtenerServicios();
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.postServicio = async (req, res) => {
    try {
        const resultado = await serviciosModel.crearServicio(req.body);
        res.json(resultado);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({ message: "¡Error! Este servicio ya se encuentra registrado." });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.putServicio = async (req, res) => {
    try {
        const id = req.params.id;
        const resultado = await serviciosModel.actualizarServicio(id, req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteServicio = async (req, res) => {
    try {
        const id = req.params.id;
        const resultado = await serviciosModel.eliminarServicio(id);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};