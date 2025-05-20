const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

exports.authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: 'Acceso no autorizado' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.id;
    req.userRoles = decoded.roles;  // Añade roles al request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};