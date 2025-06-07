const mongoose = require('mongoose');
const path = require('path');
const User = require(path.join(__dirname, '..', 'models', 'User'));
const Procer = require(path.join(__dirname, '..', 'models', 'Procer'));
const bcrypt = require('bcryptjs');

class InitialSetup {
  constructor() {
    this.adminData = {
      username: "admin@yourapp.com",
      email: "admin@yourapp.com",
      password: "Admin1234",
      role: "admin",
      profile: { firstName: "Admin", lastName: "System" }
    };
  }

  async initialize() {
    try {
      await this._createAdminUser();
      console.log("✅ Setup completado");
    } catch (error) {
      console.error("❌ Error en setup:", error);
    }
  }

  async _createAdminUser() {
    let admin = await User.findOne({ email: this.adminData.email });
    
    if (!admin) {
      this.adminData.password = await bcrypt.hash(this.adminData.password, 12);
      admin = await User.create(this.adminData);
      console.log("👤 Admin creado");
    }
    return admin;
  }
}

module.exports = InitialSetup;