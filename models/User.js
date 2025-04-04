const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    nombre_completo: {
        type: { nombre: String, apellido: String },
        required: true
    },
    telefono: {
        type: [String],
        default: []
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    tipo: {
        type: String,
        required: true
    },
    mascota: {
        type: [String],
        default: []
    },
    password: {
        type: String,
        required: true
    },
  
});

module.exports = mongoose.model("User", UserSchema);
