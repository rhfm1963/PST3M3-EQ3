const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const procerSchema = new mongoose.Schema({
  // Identificación única
  id: {
    type: String,
    default: uuidv4,
    unique: true
  },

  // Datos básicos
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    index: true
  },

  nombre_completo: {
    type: String,
    trim: true
  },

  apodo: {
    type: String,
    trim: true,
    index: true
  },

  // Datos cronológicos
  fecha_nacimiento: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v <= new Date();
      },
      message: 'La fecha de nacimiento no puede ser futura'
    }
  },

  fecha_fallecimiento: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || !this.fecha_nacimiento || v > this.fecha_nacimiento;
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
        return !v || /\.(jpg|jpeg|png|webp)$/i.test(v);
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
        if (!v) return true;
        const asset = await mongoose.model('Asset').findById(v).select('type');
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
        if (!v) return true;
        const asset = await mongoose.model('Asset').findById(v).select('type');
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
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'ultimaActualizacion'
  },
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Índices compuestos (optimizados)
procerSchema.index({ 
  nombre: 'text', 
  apodo: 'text', 
  frase_celebre: 'text'
});

// Middleware para actualización (corregido)
procerSchema.pre('save', function(next) {
  if (this.isModified('modelo3D') || this.isModified('marcadorAR')) {
    this.version += 1;
  }
  next();
});

// Virtual para edad (optimizado)
procerSchema.virtual('edad').get(function() {
  if (!this.fecha_nacimiento) return null;
  
  const referencia = this.fecha_fallecimiento || new Date();
  const nacimiento = new Date(this.fecha_nacimiento);
  
  let edad = referencia.getFullYear() - nacimiento.getFullYear();
  const mesReferencia = referencia.getMonth();
  const mesNacimiento = nacimiento.getMonth();
  
  if (mesReferencia < mesNacimiento || 
      (mesReferencia === mesNacimiento && referencia.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
});

// Método estático para búsqueda mejorada
procerSchema.statics.buscarPorNombre = async function(nombre) {
  if (!nombre || typeof nombre !== 'string') {
    throw new Error('El nombre de búsqueda debe ser una cadena válida');
  }

  return this.find(
    { $text: { $search: nombre } },
    { score: { $meta: "textScore" } }
  )
  .select('-__v -createdAt -updatedAt')
  .sort({ score: { $meta: "textScore" } })
  .populate('modelo3D marcadorAR', 'url type -_id')
  .lean();
};

module.exports = mongoose.model('Procer', procerSchema);