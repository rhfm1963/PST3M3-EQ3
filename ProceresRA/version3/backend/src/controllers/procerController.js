const Procer = require('../models/Procer');
const Asset = require('../models/Asset');
const Scene = require('../models/Scene');
const { createARMarker } = require('../utils/arMarkerGenerator');
const { validateProcerData } = require('../utils/dataValidator');

const ProcerController = {
  /**
   * Obtener todos los próceres con filtros opcionales
   */
  getAll: async (req, res) => {
    try {
      const { search, sort, fields } = req.query;
      const query = {};
      
      // Filtro de búsqueda
      if (search) {
        query.$or = [
          { nombre: { $regex: search, $options: 'i' } },
          { apodo: { $regex: search, $options: 'i' } },
          { 'logros': { $regex: search, $options: 'i' } }
        ];
      }

      // Selección de campos
      const projection = fields ? fields.split(',').join(' ') : '';
      
      // Ordenamiento
      const sortOption = sort ? sort.split(',').join(' ') : 'nombre';

      const proceres = await Procer.find(query)
        .select(projection)
        .sort(sortOption)
        .populate('modelo3D', 'url thumbnail')
        .populate('marcador', 'url')
        .populate('escenas', 'name markerImage');

      res.json({
        success: true,
        count: proceres.length,
        data: proceres
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener los próceres: ' + error.message
      });
    }
  },

  /**
   * Obtener un prócer por ID con contenido AR completo
   */
  getById: async (req, res) => {
    try {
      const procer = await Procer.findById(req.params.id)
        .populate('modelo3D', 'url thumbnail fileSize format')
        .populate('marcador', 'url type')
        .populate('escenas', 'name markerImage assets')
        .populate('creadoPor', 'username profile');

      if (!procer) {
        return res.status(404).json({
          success: false,
          error: 'Prócer no encontrado'
        });
      }

      // Estructura especial para AR
      const arResponse = {
        procer: procer.toObject(),
        arContent: {
          modelUrl: procer.modelo3D?.url,
          markerUrl: procer.marcador?.url,
          scenes: procer.escenas.map(scene => ({
            id: scene._id,
            name: scene.name,
            markerImage: scene.markerImage
          }))
        }
      };

      res.json({
        success: true,
        data: arResponse
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener el prócer: ' + error.message
      });
    }
  },

  /**
   * Crear un nuevo prócer con generación automática de marcador AR
   */
  create: async (req, res) => {
    try {
      // Validar datos del prócer
      const { error } = validateProcerData(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const procerData = req.body;
      procerData.creadoPor = req.user._id;

      // Generar marcador AR si no se proporciona uno
      if (!procerData.marcador) {
        const markerName = `marker-${procerData.nombre.toLowerCase().replace(/\s+/g, '-')}`;
        const markerPath = await createARMarker(
          procerData.nombre, 
          markerName,
          req.user._id
        );

        const markerAsset = new Asset({
          name: `Marcador ${procerData.nombre}`,
          type: 'ar_marker',
          url: markerPath,
          createdBy: req.user._id
        });

        const savedMarker = await markerAsset.save();
        procerData.marcador = savedMarker._id;
      }

      const nuevoProcer = new Procer(procerData);
      const procerGuardado = await nuevoProcer.save();

      res.status(201).json({
        success: true,
        data: procerGuardado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al crear el prócer: ' + error.message
      });
    }
  },

  /**
   * Actualizar un prócer existente
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validar datos de actualización
      const { error } = validateProcerData(updateData, true);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const procerActualizado = await Procer.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      )
        .populate('modelo3D')
        .populate('marcador');

      if (!procerActualizado) {
        return res.status(404).json({
          success: false,
          error: 'Prócer no encontrado'
        });
      }

      res.json({
        success: true,
        data: procerActualizado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al actualizar el prócer: ' + error.message
      });
    }
  },

  /**
   * Obtener contenido AR específico para un prócer
   */
  getARContent: async (req, res) => {
    try {
      const procer = await Procer.findById(req.params.id)
        .populate('modelo3D', 'url thumbnail')
        .populate('marcador', 'url type')
        .populate('escenas', 'name markerImage assets');

      if (!procer) {
        return res.status(404).json({
          success: false,
          error: 'Prócer no encontrado'
        });
      }

      // Verificar que tenga los recursos AR necesarios
      if (!procer.modelo3D || !procer.marcador) {
        return res.status(400).json({
          success: false,
          error: 'El prócer no tiene configurado el contenido AR completo'
        });
      }

      const arContent = {
        procer: {
          id: procer._id,
          nombre: procer.nombre,
          apodo: procer.apodo
        },
        model: {
          url: procer.modelo3D.url,
          thumbnail: procer.modelo3D.thumbnail,
          scale: 0.5, // Valor por defecto, ajustable
          position: { x: 0, y: 0, z: 0 }
        },
        marker: {
          url: procer.marcador.url,
          type: procer.marcador.type || 'pattern'
        },
        scenes: procer.escenes.map(scene => ({
          id: scene._id,
          name: scene.name,
          markerImage: scene.markerImage
        }))
      };

      res.json({
        success: true,
        data: arContent
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener contenido AR: ' + error.message
      });
    }
  },

  /**
   * Buscar próceres por características específicas (para filtros en el frontend)
   */
  search: async (req, res) => {
    try {
      const { batalla, logro, fecha } = req.query;
      const query = {};

      if (batalla) {
        query.batallas_importantes = { $regex: batalla, $options: 'i' };
      }

      if (logro) {
        query.logros = { $regex: logro, $options: 'i' };
      }

      if (fecha) {
        query.fecha_nacimiento = { $gte: new Date(fecha) };
      }

      const proceres = await Procer.find(query)
        .select('nombre apodo fecha_nacimiento modelo3D marcador')
        .populate('modelo3D', 'thumbnail')
        .limit(20);

      res.json({
        success: true,
        count: proceres.length,
        data: proceres
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error en la búsqueda: ' + error.message
      });
    }
  }
};

module.exports = ProcerController;