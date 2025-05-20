require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

module.exports = async () => {
  try {
    // Verificar si ya existe el admin
    const adminExists = await User.findOne({ 
      email: process.env.ADMIN_EMAIL,
      role: 'admin' // ← Aseguramos que sea admin
    });

    if (adminExists) {
      console.log('🛂 Usuario admin ya existe');
      return;
    }

    // Crear o actualizar el usuario
    await User.findOneAndUpdate(
      { email: process.env.ADMIN_EMAIL },
      {
        email: process.env.ADMIN_EMAIL,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
        role: 'admin' // ← Fuerza el rol admin
      },
      { upsert: true, new: true } // Crea si no existe
    );

    console.log('👑 Admin creado/actualizado:', process.env.ADMIN_EMAIL);
  } catch (error) {
    console.error('❌ Error al crear admin:', error.message);
  }
};