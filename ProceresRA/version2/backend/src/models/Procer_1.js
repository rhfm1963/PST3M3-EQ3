// models/Procer.js
const mongoose = require('mongoose');

const procerSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  nombre_completo: String,
  apodo: String,
  fecha_nacimiento: Date,
  fecha_fallecimiento: Date,
  lugar_nacimiento: String,
  lugar_fallecimiento: String,
  cargos: [String],
  batallas_importantes: [String],
  logros: [String],
  frase_celebre: String,
  modelo3D: {  // Para asociar con recursos de RA
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  marcador: {  // Para realidad aumentada
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  escenas: [{  // Escenas relacionadas
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scene'
  }],
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// Middleware para formatear fechas antes de guardar
procerSchema.pre('save', function(next) {
  if (this.fecha_nacimiento && typeof this.fecha_nacimiento === 'string') {
    this.fecha_nacimiento = new Date(this.fecha_nacimiento);
  }
  if (this.fecha_fallecimiento && typeof this.fecha_fallecimiento === 'string') {
    this.fecha_fallecimiento = new Date(this.fecha_fallecimiento);
  }
  next();
});

module.exports = mongoose.model('Procer', procerSchema);