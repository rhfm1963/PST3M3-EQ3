const express = require("express");
const path = require("path"); 
const connectDB = require("./config/db");
const initAdmin = require("./config/initialAdmin");
const authMiddleware = require("./middlewares/auth");

// Cargar modelos PRIMERO (antes de cualquier operación con DB)
require("./models/User");
require("./models/Asset");
require("./models/Scene");
require("./models/Procer");

const app = express();

// Middlewares
app.use(express.json());

const startServer = async () => {
  try {
    await connectDB();
    await initAdmin();

    // Ejecutar inicialización después de conectar (con validación)
    if (process.env.RUN_INITIAL_SETUP === "true") {
      try {
        const InitialSetup = require(path.join(__dirname, "./scripts/initialSetup"));
        const initialSetup = new InitialSetup();
        await initialSetup.initialize();
        console.log("✅ Setup inicial completado");
      } catch (setupError) {
        console.error("❌ Error en initialSetup:", setupError.message);
        // No salir del proceso, solo continuar sin setup
      }
    }

    // Rutas
    app.use("/api/auth", require("./routes/authRoutes"));
    app.use(
      "/api/ar",
      authMiddleware.authenticate,
      require("./routes/arRoutes")
    );

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error crítico al iniciar:", err);
    process.exit(1);
  }
};

startServer();
