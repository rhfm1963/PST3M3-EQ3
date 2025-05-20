const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Exporta como objeto
module.exports = {
  authenticate,
  checkRole: require('./roleCheck').checkRole
};