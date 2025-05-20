const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, refreshTokenSecret } = require('../config/env');

// Helper: Generar tokens
const generateTokens = (userId, roles) => {
  const accessToken = jwt.sign(
    { id: userId, roles },
    jwtSecret,
    { expiresIn: '15m' }  // Token de acceso corto
  );
  const refreshToken = jwt.sign(
    { id: userId },
    refreshTokenSecret,
    { expiresIn: '7d' }  // Token de refresco largo
  );
  return { accessToken, refreshToken };
};

// Registro con roles
exports.register = async (req, res) => {
  const { email, password, roles = ['user'] } = req.body;  // Roles opcionales

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email ya registrado' });

    const user = new User({ email, password, roles });
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id, user.roles);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({ accessToken, refreshToken, roles: user.roles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login con refresh token
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.roles);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, roles: user.roles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Token requerido' });

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ error: 'Token inválido' });

    jwt.verify(refreshToken, refreshTokenSecret, (err, decoded) => {
      if (err || user._id.toString() !== decoded.id) {
        return res.status(403).json({ error: 'Token inválido' });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.roles);
      user.refreshToken = newRefreshToken;
      user.save();

      res.json({ accessToken, refreshToken: newRefreshToken });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout (invalidar refresh token)
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    await User.findOneAndUpdate(
      { refreshToken },
      { $unset: { refreshToken: 1 } }
    );
    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};