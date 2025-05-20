const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { User, Procer } = require("../models");

class InitialSetup {
  constructor() {
    this.adminData = {
      username: "admin@yourapp.com",
      email: "admin@yourapp.com",
      password: "Admin1234",
      role: "admin",
      profile: {
        firstName: "Admin",
        lastName: "System",
      },
    };

    this.proceresPath = path.join(__dirname, "..", "data", "proceres.json");
  }

  async initialize() {
    try {
      await this._createAdminUser();
      await this._loadProceresData();
      console.log("✅ Sistema de inicialización completado");
    } catch (error) {
      console.error("❌ Error en inicialización:", error);
    }
  }

  async _createAdminUser() {
    const adminExists = await User.findOne({ email: this.adminData.email });

    if (!adminExists) {
      this.adminData.password = await bcrypt.hash(this.adminData.password, 12);
      await User.create(this.adminData);
      console.log("👤 Usuario admin creado");
    }
  }

  async _loadProceresData() {
    if (!fs.existsSync(this.proceresPath)) {
      console.log("ℹ️  No se encontró archivo de próceres");
      return;
    }

    const rawData = fs.readFileSync(this.proceresPath);
    const { proceres } = JSON.parse(rawData);
    const adminUser = await User.findOne({ role: "admin" });

    for (const procerData of proceres) {
      try {
        const exists = await Procer.findOne({ id: procerData.id });
        if (!exists) {
          procerData.creadoPor = adminUser._id;
          await Procer.create(procerData);
          console.log(`🦅 Prócer cargado: ${procerData.nombre}`);
        }
      } catch (error) {
        console.error(`Error con prócer ${procerData.nombre}:`, error.message);
      }
    }
  }
}

module.exports = InitialSetup;
