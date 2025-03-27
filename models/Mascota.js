const mongoose = require('mongoose');

const MascotaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    raza: { type: String, required: true },
    color: { type: String, required: true },
    peso: { type: Number, required: true },
    foto: { type: String, required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' } // Relación con el usuario
});

module.exports = mongoose.model('Mascota', MascotaSchema);
