require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

module.exports = async () => {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('🛂 Admin ya existe:', existingAdmin.email);
      return;
    }

    // Crear nuevo admin
    const admin = await User.create({
      email: process.env.ADMIN_EMAIL,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
      role: 'admin' // ← Rol explícito
    });

    console.log('👑 Admin creado:', admin.email);
  } catch (error) {
    console.error('❌ Error al crear admin:', error.message);
  }
};