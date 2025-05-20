const mongoose = require('mongoose');

const ARSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Nombre es requerido'],
    trim: true,
    maxlength: [100, 'Máximo 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Máximo 500 caracteres']
  },
  modelUrl: {
    type: String,
    required: [true, 'URL del modelo es requerida'],
    validate: {
      validator: function(v) {
        return /^(https?:\/\/|\.\/|\/).+\.(glb|gltf|obj)$/i.test(v);
      },
      message: props => `Formato de archivo no soportado: ${props.value}`
    }
  },
  markerUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^(https?:\/\/|\.\/|\/).+\.(png|jpg|jpeg)$/i.test(v);
      },
      message: 'Solo imágenes PNG/JPG para marcadores'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuario creador es requerido']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, {
  versionKey: false, // Elimina __v
  toJSON: { virtuals: true }, // Para populate()
  toObject: { virtuals: true }
});

// Índices para mejor performance
ARSchema.index({ name: 'text', description: 'text' });
ARSchema.index({ createdAt: -1 });
ARSchema.index({ createdBy: 1 });

module.exports = mongoose.model('ARModel', ARSchema);