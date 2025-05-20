// src/config/initialAdmin.js
await User.findOneAndUpdate(
  { email: process.env.ADMIN_EMAIL },
  {
    email: process.env.ADMIN_EMAIL,
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
    roles: ['admin', 'user'] // ← Usa el array de roles
  },
  { upsert: true, new: true }
);