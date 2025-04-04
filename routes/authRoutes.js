
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { nombre_completo, telefono, email, tipo, mascota, password } = req.body;

        if (!nombre_completo || !telefono || !email || !password) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "El correo ya está registrado" });

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({ nombre_completo, telefono, email, tipo, mascota, password: hashedPassword });
        await user.save();

        res.status(201).json({ msg: "Usuario registrado correctamente" });
    } catch (error) {
        console.error(" Error en /register:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});


router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(" Intento de inicio de sesión:", req.body);

        if (!email || !password) {
            return res.status(400).json({ msg: "Correo y contraseña son obligatorios" });
        }

        const user = await User.findOne({ email }).select("+password"); // Aquí corregido
        if (!user) {
            console.log(" Usuario no encontrado en la BD con email:", email);
            return res.status(400).json({ msg: "Usuario no encontrado" });
        }

        console.log(" Usuario encontrado:", user.email);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(" Coincide:", isMatch);

        if (!isMatch) {
            console.log(" Contraseña incorrecta");
            return res.status(400).json({ msg: "Contraseña incorrecta" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        console.error(" Error en /login:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});



module.exports = router;

