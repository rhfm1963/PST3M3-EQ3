const express = require("express");
const connectDB = require("./config/db");
const initAdmin = require("./config/initialAdmin");
const InitialSetup = require("../scripts/initialSetup");
const authMiddleware = require("../middlewares/auth");


const app = express();

// Middlewares
app.use(express.json());

const startServer = async () => {
  try {
    await connectDB();
    await initAdmin();

    // Ejecutar inicialización después de conectar
    if (process.env.RUN_INITIAL_SETUP === "true") {
      const initialSetup = new InitialSetup();
      await initialSetup.initialize();
    }

    // Después de conectar a MongoDB
    require("./models/User");
    require("./models/Asset");
    require("./models/Scene");
    require("./models/Procer");

    // Rutas
    app.use("/api/auth", require("./routes/authRoutes"));
    app.use(
      "/api/ar",
      authMiddleware.authenticate,
      require("./routes/arRoutes")
    );

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error al iniciar:", err);
    process.exit(1);
  }
};

startServer();
