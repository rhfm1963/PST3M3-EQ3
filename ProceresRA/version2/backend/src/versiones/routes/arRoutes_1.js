const express = require('express');
const router = express.Router();
const { checkRole } = require('../middlewares/roleCheck'); // Importa el middleware
const arController = require('../controllers/arController');

// Ruta protegida con roles
router.post('/models', 
  checkRole(['admin', 'ar_creator']), // Usa el middleware
  arController.createARModel
);

router.get('/models', arController.getARModels);

module.exports = router;