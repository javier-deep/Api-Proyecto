const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { appendFile } = require('fs');

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
const Usuario = mongoose.model('User', UsuarioSchema);

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

        res.status(200).json({ 
            message: "✅ Inicio de sesión exitoso", 
            usuario: {
                _id: usuario._id, 
                email: usuario.email
            }
        });
    } catch (error) {
        console.error("❌ Error en el login:", error);
        res.status(500).json({ error: "Error al iniciar sesión" });
    }
});


app.post('/registrar-mascota', upload.single('foto'), async (req, res) => {
    console.log("📥 Datos recibidos en registrar-mascota:", req.body);
    const { nombre, raza, color, peso, usuarioId } = req.body;

    if (!nombre || !raza || !color || !peso || !usuarioId || !req.file) {
        return res.status(400).json({ error: "Todos los campos y la foto son obligatorios" });
    }

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


app.get('/mascotas/buscar', async (req, res) => {
  const { email, usuarioId } = req.query;

  if (email) {
    // Buscar mascotas por email
    try {
      const mascotas = await Mascota.find({ email: email });
      res.json(mascotas);
    } catch (error) {
      console.error("Error al buscar mascotas:", error);
      res.status(500).json({ error: "Error al buscar mascotas por email" });
    }
  } else if (usuarioId) {
    // Buscar mascotas por usuarioId
    try {
      const mascotas = await Mascota.find({ usuarioId: usuarioId });
      res.json(mascotas);
    } catch (error) {
      console.error("Error al buscar mascotas:", error);
      res.status(500).json({ error: "Error al buscar mascotas por usuarioId" });
    }
  } else {
    res.status(400).json({ error: "Faltan parámetros de búsqueda" });
  }
});

  app.get('/usuario-buscar', async (req, res) => {
    const { email } = req.query;

    try {
        console.log('Buscando usuario con email:', email);

        // Asegúrate de convertir el email a minúsculas
        const usuario = await Usuario.findOne({ email: email.toLowerCase() });

        if (!usuario) {
            console.log('Usuario no encontrado para el email:', email);
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        console.log('Usuario encontrado:', usuario);  // Verifica que los datos estén bien

        // Extraemos el nombre y el teléfono directamente desde el documento
        const nombre = usuario.nombre || "";  // Asegúrate de que sea 'nombre'
        const telefono = usuario.telefono || "";  // Extrae directamente como string

        console.log('Datos a devolver:', {
            nombre,
            telefono,
            email: usuario.email
        });  // Verifica los datos antes de devolverlos

        res.status(200).json({
            nombre,
            telefono,
            email: usuario.email
        });
    } catch (error) {
        console.error('Error al obtener los datos del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});

app.put('/usuario-editar', async (req, res) => {
    const { nombre, telefono, email } = req.body;

    try {
        // Buscar y actualizar el usuario por email
        const usuario = await Usuario.findOneAndUpdate(
            { email: email.toLowerCase() }, // Convertir email a minúsculas para evitar problemas de mayúsculas
            { nombre, telefono },
            { new: true } // Retorna el documento actualizado
        );

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ message: 'Usuario actualizado', usuario });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});

app.post('/update-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    try {
        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        // Asegúrate de convertir el email a minúsculas
        const usuario = await Usuario.findOne({ email: email.toLowerCase() });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const isMatch = await bcrypt.compare(currentPassword, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        usuario.password = hashedPassword;
        await usuario.save();

        return res.status(200).json({ message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error('Error en el servidor:', error.message);
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});


  
  


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
