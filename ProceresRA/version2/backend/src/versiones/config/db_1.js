const mongoose = require('mongoose');
require('dotenv').config(); // Carga variables de entorno desde .env

const connectDB = async () => {
  try {
    // Conexión a MongoDB usando la URI del archivo .env
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Opciones recomendadas para versiones recientes de Mongoose:
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Cierra sockets inactivos después de 45 segundos
    });
    console.log('✅ MongoDB conectado correctamente');
  } catch (err) {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    // Termina el proceso con error (opcional, útil en producción)
    process.exit(1);
  }
};

// Eventos de conexión para manejar errores post-conexión
mongoose.connection.on('error', (err) => {
  console.log('⚠️ Error post-conexión de MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB desconectado');
});

module.exports = connectDB;