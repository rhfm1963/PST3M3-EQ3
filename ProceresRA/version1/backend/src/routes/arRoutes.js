const express = require('express');
const router = express.Router();
const { checkRole } = require('../middlewares/auth'); // Importa desde el objeto
const arController = require('../controllers/arController');

router.post('/models', 
  checkRole(['admin', 'ar_creator']), // Ahora funciona
  arController.createARModel
);

router.get('/models', arController.getARModels);

module.exports = router;