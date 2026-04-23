const mongoose = require('mongoose');

const habitacionSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  descripcion: { type: String },
  imagen: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Habitacion', habitacionSchema);