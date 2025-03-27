const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { nombre_completo, telefono, correo, tipo, mascota, password } = req.body;

        if (!nombre_completo || !telefono || !correo || !password) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });
        }

        let user = await User.findOne({ correo });
        if (user) return res.status(400).json({ msg: "El correo ya está registrado" });

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({ nombre_completo, telefono, correo, tipo, mascota, password: hashedPassword });
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
        const correo = email;  

        console.log(" Intento de inicio de sesión:", req.body);

        if (!correo || !password) {
            return res.status(400).json({ msg: "Correo y contraseña son obligatorios" });
        }

        const user = await User.findOne({ correo }).select("+password");
        if (!user) {
            console.log(" Usuario no encontrado en la BD con correo:", correo);
            return res.status(400).json({ msg: "Usuario no encontrado" });
        }

        console.log(" Usuario encontrado:", user.correo);

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
