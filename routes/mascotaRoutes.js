
const express = require("express");
const Mascota = require("../models/Mascota");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../config/multer");

// Registrar una nueva mascota con imagen
router.post("/registrar", authMiddleware, upload.single("foto"), async (req, res) => {
    try {
        const { nombre, raza, color, peso } = req.body;
        const usuarioId = req.user.id;

        if (!nombre || !raza || !color || !peso || !req.file) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });
        }

        const nuevaMascota = new Mascota({
            nombre,
            raza,
            color,
            peso,
            foto: `/uploads/${req.file.filename}`, // Ruta de la imagen
            usuario: usuarioId
        });

        await nuevaMascota.save();
        res.status(201).json({ msg: "Mascota registrada correctamente", mascota: nuevaMascota });
    } catch (error) {
        console.error("Error en /registrar mascota:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// Obtener las mascotas del usuario autenticado
router.get("/mis-mascotas", authMiddleware, async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const mascotas = await Mascota.find({ usuario: usuarioId });

        res.json(mascotas);
    } catch (error) {
        console.error("Error en /mis-mascotas:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

module.exports = router;
