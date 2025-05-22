const mongoose = require('mongoose');
const path = require('path');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del asset es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
  },
  type: {
    type: String,
    required: [true, 'El tipo de asset es requerido'],
    enum: {
      values: ['3d_model', 'image', 'video', 'audio', 'ar_marker', 'texture', 'other'],
      message: 'Tipo de asset no válido'
    }
  },
  url: {
    type: String,
    required: [true, 'La URL del asset es requerida'],
    validate: {
      validator: function(v) {
       
      },
      message: props => `${props.value} no es una URL válida`
    }
  },
  thumbnail: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    min: [0, 'El tamaño de archivo no puede ser negativo']
  },
  format: {
    type: String,
    uppercase: true,
    enum: ['GLB', 'GLTF', 'FBX', 'OBJ', 'JPEG', 'PNG', 'MP4', 'WEBM', 'MP3', 'WAV', 'PAT', 'OTHER']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El creador del asset es requerido']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  tags: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'No puedes tener más de 10 tags'
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  metadata: {
    // Para modelos 3D
    vertices: Number,
    triangles: Number,
    animations: [String],
    // Para imágenes/marcadores
    dimensions: {
      width: Number,
      height: Number
    },
    // Para audio/video
    duration: Number
  },
  relatedProcer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Procer'
  },
  sceneUsage: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scene'
  }]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejor performance
assetSchema.index({ name: 'text', tags: 'text' });
assetSchema.index({ type: 1 });
assetSchema.index({ createdBy: 1 });
assetSchema.index({ relatedProcer: 1 });

// Middleware para actualizar fecha de modificación
assetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual para obtener la extensión del archivo
assetSchema.virtual('extension').get(function() {
  return path.extname(this.url);
});

// Virtual para URL completa (si es relativa)
assetSchema.virtual('fullUrl').get(function() {
  if (this.url.startsWith('http')) {
    return this.url;
  }
  return `${process.env.ASSETS_BASE_URL || ''}${this.url}`;
});

// Método para limpiar datos antes de enviar al cliente
assetSchema.methods.toClient = function() {
  const obj = this.toObject();
  
  // Campos a eliminar
  delete obj.__v;
  delete obj.sceneUsage;
  
  // Renombrar _id
  obj.id = obj._id;
  delete obj._id;
  
  return obj;
};

module.exports = mongoose.model('Asset', assetSchema);