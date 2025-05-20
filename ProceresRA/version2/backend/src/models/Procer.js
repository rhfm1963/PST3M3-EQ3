const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const procerSchema = new mongoose.Schema({
  // Identificación única
  id: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },

  // Datos básicos
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },

  nombre_completo: {
    type: String,
    trim: true
  },

  apodo: {
    type: String,
    trim: true
  },

  // Datos cronológicos
  fecha_nacimiento: {
    type: Date,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'La fecha de nacimiento no puede ser futura'
    }
  },

  fecha_fallecimiento: {
    type: Date,
    validate: {
      validator: function(v) {
        return !this.fecha_nacimiento || v > this.fecha_nacimiento;
      },
      message: 'La fecha de fallecimiento debe ser posterior al nacimiento'
    }
  },

  // Ubicaciones
  lugar_nacimiento: {
    type: String,
    trim: true
  },

  lugar_fallecimiento: {
    type: String,
    trim: true
  },

  // Arrays de datos
  cargos: [{
    type: String,
    trim: true
  }],

  batallas_importantes: [{
    type: String,
    trim: true
  }],

  logros: [{
    type: String,
    trim: true
  }],

  // Multimedia
  frase_celebre: {
    type: String,
    trim: true
  },

  imagen_perfil: {
    type: String,
    validate: {
      validator: function(v) {
        return /\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: 'La imagen debe ser JPG, JPEG, PNG o WEBP'
    }
  },

  // Relaciones con AR
  modelo3D: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    validate: {
      validator: async function(v) {
        const asset = await mongoose.model('Asset').findById(v);
        return asset && asset.type === '3d_model';
      },
      message: 'El Asset debe ser de tipo 3D model'
    }
  },

  marcadorAR: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    validate: {
      validator: async function(v) {
        const asset = await mongoose.model('Asset').findById(v);
        return asset && asset.type === 'ar_marker';
      },
      message: 'El Asset debe ser de tipo AR marker'
    }
  },

  escenas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scene'
  }],

  // Metadata
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  fechaCreacion: {
    type: Date,
    default: Date.now
  },

  ultimaActualizacion: {
    type: Date
  },

  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'borrador'],
    default: 'activo'
  },

  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware para actualización
procerSchema.pre('save', function(next) {
  this.ultimaActualizacion = new Date();
  
  if (this.isModified('modelo3D') || this.isModified('marcadorAR')) {
    this.version += 1;
  }
  
  next();
});

// Índices para mejor performance
procerSchema.index({ nombre: 'text', apodo: 'text', logros: 'text' });
procerSchema.index({ fecha_nacimiento: 1 });
procerSchema.index({ estado: 1 });

// Virtual para edad
procerSchema.virtual('edad').get(function() {
  if (!this.fecha_nacimiento) return null;
  
  const hoy = new Date();
  const nacimiento = new Date(this.fecha_nacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  
  if (this.fecha_fallecimiento) {
    const fallecimiento = new Date(this.fecha_fallecimiento);
    edad = fallecimiento.getFullYear() - nacimiento.getFullYear();
  } else {
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
  }
  
  return edad;
});

// Método para simplificar la respuesta
procerSchema.methods.toClient = function() {
  const obj = this.toObject();
  
  // Campos a eliminar
  delete obj.__v;
  delete obj._id;
  
  // Renombrar campos
  obj.id = obj.id || this._id;
  
  return obj;
};

// Método estático para búsqueda mejorada
procerSchema.statics.buscarPorNombre = function(nombre) {
  return this.find({ 
    $text: { $search: nombre } 
  }, { 
    score: { $meta: "textScore" } 
  }).sort({ 
    score: { $meta: "textScore" } 
  });
};

// Exportar modelo
module.exports = mongoose.model('Procer', procerSchema);