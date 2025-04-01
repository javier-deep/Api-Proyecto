const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

//const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// Conexión a MongoDB
mongoose.connect('mongodb+srv://mewfoodcontacto:mewfood@cluster0.somvq.mongodb.net/mewfood', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Conectado"))
  .catch(err => console.error("❌ Error al conectar MongoDB", err));

// Esquema de Usuario
const UsuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    telefono: { type: String, required: true },
    password: { type: String, required: true },
    mascotas: [
        {
            nombre: { type: String, required: true },
            raza: { type: String, required: true },
            color: { type: String, required: true },
            peso: { type: Number, required: true },
            foto: { type: String, required: true }
        }
    ]
});
const Usuario = mongoose.model('users', UsuarioSchema);

// Esquema de Mascota
const MascotaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    raza: { type: String, required: true },
    color: { type: String, required: true },
    peso: { type: Number, required: true },
    foto: { type: String, required: true },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true }
});
const Mascota = mongoose.model('Mascota', MascotaSchema);

// Configuración de almacenamiento para imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Rutas
// Registro de usuarios
app.post('/register', async (req, res) => {
    console.log("📥 Datos recibidos en registro:", req.body);
    const { nombre, email, telefono, password } = req.body;

    if (!nombre || !email || !telefono || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoUsuario = new Usuario({ nombre, email, telefono, password: hashedPassword });
        await nuevoUsuario.save();
        res.status(201).json({ message: "✅ Registro exitoso" });
    } catch (error) {
        console.error("❌ Error en el registro:", error);
        res.status(400).json({ error: "Error al registrar usuario" });
    }
});

// Inicio de sesión
app.post('/login', async (req, res) => {
    console.log("📥 Intento de inicio de sesión:", req.body);
    const { email, password } = req.body;

    try {
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(400).json({ error: "Usuario no encontrado" });
        }

        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Contraseña incorrecta" });
        }

        res.status(200).json({ message: "✅ Inicio de sesión exitoso", usuario });
    } catch (error) {
        console.error("❌ Error en el login:", error);
        res.status(500).json({ error: "Error al iniciar sesión" });
    }
});

// Registro de mascota
app.post('/registrar-mascota', upload.single('foto'), async (req, res) => {
    console.log("📥 Datos recibidos en registrar-mascota:", req.body);
    const { nombre, raza, color, peso, usuarioId } = req.body;

    if (!nombre || !raza || !color || !peso || !usuarioId || !req.file) {
        return res.status(400).json({ error: "Todos los campos y la foto son obligatorios" });
    }

    // Validación de usuario existente
    try {
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(400).json({ error: "Usuario no encontrado en la base de datos." });
        }

        const nuevaMascota = new Mascota({
            nombre,
            raza,
            color,
            peso: parseFloat(peso),
            foto: `/uploads/${req.file.filename}`,
            usuarioId
        });

        await nuevaMascota.save();
        res.status(201).json({ message: "✅ Mascota registrada con éxito", mascota: nuevaMascota });
    } catch (error) {
        console.error("❌ Error al registrar la mascota:", error);
        res.status(400).json({ error: "Error al registrar mascota" });
    }
});

// Obtener mascotas
app.get('/mascotas', async (req, res) => {
    try {
        const mascotas = await Mascota.find();
        res.status(200).json(mascotas);
    } catch (error) {
        console.error("❌ Error al obtener mascotas:", error);
        res.status(500).json({ error: "Error al obtener mascotas" });
    }
});

//app.listen(PORT, () => {
//console.log(`🚀 Servidor corriendo en https://https://api-proyecto-4.onrender.com`);
//});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Iniciar servidor
//app.listen(PORT, () => {
//console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
//});
