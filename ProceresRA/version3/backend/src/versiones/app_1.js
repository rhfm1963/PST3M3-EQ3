const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


// Corrige las rutas (usa ./ en lugar de ../)
const arRoutes = require('./routes/arRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Conexión a MongoDB (ruta corregida)
require('./config/db');

// Antes de las rutas
require('./models/arModel');
require('./models/User');

// Rutas
app.use('/api/ar', arRoutes);
app.use('/api/auth', authRoutes);

// Después de conectar MongoDB
require('./config/db').then(async () => {
    // Inicializar admin
    const initAdminUser = require('./config/initialAdmin');
    await initAdminUser();
  
    // Iniciar servidor
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });

