const paqueteService = require('../services/paquete.service');

const getAllPaquetes = async (req, res) => {
    try {
        const paquetes = await paqueteService.getAll();
        res.json(paquetes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPaqueteById = async (req, res) => {
    try {
        const paquete = await paqueteService.getById(req.params.id);
        res.json(paquete);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createPaquete = async (req, res) => {
    try {
        const paquete = await paqueteService.create(req.body);
        res.status(201).json(paquete);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({ message: "¡Error! Ya existe un paquete con ese nombre." });
        }
        res.status(500).json({ error: error.message });
    }
};

const updatePaquete = async (req, res) => {
    try {
        const paquete = await paqueteService.update(req.params.id, req.body);
        res.json(paquete);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deletePaquete = async (req, res) => {
    try {
        await paqueteService.remove(req.params.id);
        res.json({ message: "Paquete eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllPaquetes,
    getPaqueteById,
    createPaquete,
    updatePaquete,
    deletePaquete
};