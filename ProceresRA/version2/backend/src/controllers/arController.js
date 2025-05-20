const path = require('path');
const multer = require('multer');
const ARModel = require('../models/arModel');

// Configuración mejorada de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.glb', '.gltf', '.obj'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos 3D (.glb, .gltf, .obj)'), false);
    }
  }
}).single('modelFile');

// Crear modelo AR (con manejo mejorado de errores)
exports.createARModel = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const { name, description } = req.body;
      if (!req.file) {
        return res.status(400).json({ error: 'Archivo 3D requerido' });
      }

      const modelUrl = '/uploads/' + req.file.filename;
      const newModel = new ARModel({ name, description, modelUrl });
      
      await newModel.save();
      res.status(201).json(newModel);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener modelos (con paginación)
exports.getARModels = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const models = await ARModel.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await ARModel.countDocuments();
    
    res.json({
      models,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};