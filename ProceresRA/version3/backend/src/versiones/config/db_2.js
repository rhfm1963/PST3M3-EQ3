const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // Elimina las opciones obsoletas

    console.log('✅ MongoDB conectado');
    return mongoose.connection;
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;