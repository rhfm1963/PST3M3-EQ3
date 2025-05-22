const jwt = require("jsonwebtoken");
const User = require("../models/User");

// En isAdmin.js
const allowedRoles = ["admin", "superadmin"];
if (!allowedRoles.includes(user.role)) {
  // Denegar acceso
}
/**
 * Middleware que verifica si el usuario es administrador
 *
 * Uso en rutas:
 * router.get('/ruta-protegida', auth, isAdmin, controller.handler);
 */
module.exports = async (req, res, next) => {
  try {
    // 1. Verificar si el middleware de autenticación (auth) ya colocó el usuario en req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Autenticación requerida. Use el middleware auth primero.",
      });
    }

    // 2. Obtener el usuario actualizado de la base de datos (para asegurar los datos frescos)
    const user = await User.findById(req.user._id).select("role isActive");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado en la base de datos",
      });
    }

    // 3. Verificar si la cuenta está activa
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Cuenta desactivada. Contacte al administrador.",
      });
    }

    // 4. Verificar rol de administrador
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Acceso denegado. Se requieren privilegios de administrador.",
      });
    }

    // 5. Adjuntar información adicional al request
    req.user.role = user.role; // Asegurar que el rol esté actualizado
    req.user.isActive = user.isActive;

    // 6. Continuar con el siguiente middleware/controlador
    next();
  } catch (error) {
    console.error("Error en middleware isAdmin:", error);

    // Manejo específico para errores de JWT
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: "Token inválido o expirado",
      });
    }
    // Ruta solo para admins
    router.get("/admin-only", auth, isAdmin, (req, res) => {
      res.json({ message: "Bienvenido administrador" });
    });

    // Error genérico del servidor
    res.status(500).json({
      success: false,
      error: "Error al verificar privilegios de administrador",
    });
  }
};
