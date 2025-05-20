const Joi = require('joi');

exports.assetSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  type: Joi.string().valid('3d_model', 'image', 'video', 'audio', 'ar_marker', 'texture', 'other').required(),
  url: Joi.string().uri().required(),
  // ... otras validaciones
});

exports.sceneSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  markerImage: Joi.string().pattern(/\.(jpg|jpeg|png|gif|patt)$/i).required(),
  // ... otras validaciones
});