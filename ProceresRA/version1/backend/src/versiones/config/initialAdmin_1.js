require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const initAdminUser = async () => {
  try {
    // 1. Verificar si ya existe el admin
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (adminExists) {
      console.log('🛂 Usuario admin ya existe');
      return;
    }

    // 2. Crear admin si no existe
    const admin = new User({
      email: process.env.ADMIN_EMAIL,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
      role: 'admin'
    });

    await admin.save();
    console.log('👑 Admin creado:', process.env.ADMIN_EMAIL);
  } catch (error) {
    console.error('❌ Error al crear admin:', error.message);
  }
};

module.exports = initAdminUser;