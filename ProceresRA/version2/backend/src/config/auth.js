require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'clave_secreta_desarrollo',
  jwtExpiration: '1h',
  refreshTokenExpiration: '7d'
};