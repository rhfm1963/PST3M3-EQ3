const express = require('express');
const connectDB = require('./config/db');
const initAdmin = require('./config/initialAdmin');
const authMiddleware = require('./middlewares/auth');

const app = express();

// Middlewares
app.use(express.json());

const startServer = async () => {
  try {
    await connectDB();
    await initAdmin();
    
    // Rutas
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/ar', authMiddleware.authenticate, require('./routes/arRoutes'));
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar:', err);
    process.exit(1);
  }
};

startServer();
