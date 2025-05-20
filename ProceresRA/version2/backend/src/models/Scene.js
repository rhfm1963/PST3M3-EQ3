const mongoose = require('mongoose');

const sceneAssetSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: [true, 'El asset de la escena es requerido']
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  rotation: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  scale: {
    x: { type: Number, default: 1 },
    y: { type: Number, default: 1 },
    z: { type: Number, default: 1 }
  },
  animation: {
    name: String,
    loop: { type: Boolean, default: true },
    speed: { type: Number, default: 1 }
  },
  interactive: {
    type: Boolean,
    default: false
  },
  metadata: mongoose.Schema.Types.Mixed
}, { _id: false });

const sceneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la escena es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
  },
  description: {
    type: String,
    maxlength: [500, 'La descripción no puede exceder los 500 caracteres']
  },
  markerImage: {
    type: String,
    required: [true, 'La imagen marcadora es requerida'],
    validate: {
      validator: function(v) {
        return /\.(jpg|jpeg|png|gif|patt)$/i.test(v);
      },
      message: props => `${props.value} no es una imagen marcadora válida`
    }
  },
  markerType: {
    type: String,
    enum: ['image', 'qr', 'nft', 'pattern'],
    default: 'image'
  },
  assets: [sceneAssetSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El creador de la escena es requerido']
  },
  procer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Procer',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  settings: {
    lighting: {
      type: String,
      enum: ['default', 'bright', 'dark', 'custom'],
      default: 'default'
    },
    environment: String,
    shadows: {
      type: Boolean,
      default: true
    }
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejor performance
sceneSchema.index({ name: 'text', description: 'text' });
sceneSchema.index({ createdBy: 1 });
sceneSchema.index({ procer: 1 });
sceneSchema.index({ isActive: 1, isPublic: 1 });

// Middleware para actualizar fecha de modificación y versión
sceneSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.isModified('assets') || this.isModified('settings')) {
    this.version += 1;
  }
  
  next();
});

// Método para agregar un asset a la escena
sceneSchema.methods.addAsset = async function(assetId, positionData = {}) {
  const Asset = mongoose.model('Asset');
  const asset = await Asset.findById(assetId);
  
  if (!asset) {
    throw new Error('Asset no encontrado');
  }
  
  const newAsset = {
    asset: asset._id,
    position: positionData.position || { x: 0, y: 0, z: 0 },
    rotation: positionData.rotation || { x: 0, y: 0, z: 0 },
    scale: positionData.scale || { x: 1, y: 1, z: 1 }
  };
  
  this.assets.push(newAsset);
  
  // Actualizar referencia en el Asset
  if (!asset.sceneUsage.includes(this._id)) {
    asset.sceneUsage.push(this._id);
    await asset.save();
  }
  
  return this.save();
};

// Método para generar configuración AR
sceneSchema.methods.generateARConfig = function() {
  return {
    sceneId: this._id,
    marker: {
      image: this.markerImage,
      type: this.markerType
    },
    assets: this.assets.map(item => ({
      assetId: item.asset,
      type: item.asset.type, // Esto requeriría populate
      url: item.asset.url,   // Esto requeriría populate
      position: item.position,
      rotation: item.rotation,
      scale: item.scale,
      animation: item.animation
    })),
    settings: this.settings
  };
};

module.exports = mongoose.model('Scene', sceneSchema);