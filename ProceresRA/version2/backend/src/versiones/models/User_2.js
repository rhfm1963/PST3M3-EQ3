// src/models/User.js
const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email no válido']
  },
  password: { 
    type: String, 
    required: true,
    minlength: [6, 'Mínimo 6 caracteres']
  },
  role: {  // ← Cambia de 'roles' a 'role' (singular)
    type: String,
    enum: ['user', 'ar_creator', 'admin'],
    default: 'user',
    required: true
  },
  refreshToken: String,
  createdAt: { 
    type: Date, 
    default: Date.now,
    immutable: true
  }
});