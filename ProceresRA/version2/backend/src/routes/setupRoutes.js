// routes/setupRoutes.js
const express = require('express');
const InitialSetup = require('../scripts/initialSetup');
const router = express.Router();
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.post('/api/setup/run', auth, isAdmin, async (req, res) => {
  try {
    const initialSetup = new InitialSetup();
    await initialSetup.initialize();
    res.json({ success: true, message: 'Inicialización completada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;