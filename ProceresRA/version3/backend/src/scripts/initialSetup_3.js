const mongoose = require("mongoose");
const fs = require("fs").promises; // Usar la versión con promesas
const path = require("path");
const bcrypt = require("bcryptjs");
const { User, Procer } = require("../models");
const { validateProcerData } = require("../utils/validators"); // Asumiendo que tienes un validador

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
      isActive: true,
      emailVerified: true
    };

    this.proceresPath = path.join(__dirname, "..", "data", "proceres.json");
    this.batchSize = 10; // Tamaño del lote para inserciones
  }

  async initialize() {
    try {
      await this._createAdminUser();
      await this._loadProceresData();
      console.log("✅ Sistema de inicialización completado");
      return { success: true };
    } catch (error) {
      console.error("❌ Error en inicialización:", error);
      throw error; // Propagar el error para manejo superior
    }
  }

  async _createAdminUser() {
    try {
      const adminExists = await User.findOne({ 
        $or: [
          { email: this.adminData.email },
          { username: this.adminData.username }
        ]
      });

      if (!adminExists) {
        this.adminData.password = await bcrypt.hash(this.adminData.password, 12);
        const admin = await User.create(this.adminData);
        console.log("👤 Usuario admin creado con ID:", admin._id);
        return admin;
      }
      console.log("ℹ️  Usuario admin ya existe");
      return adminExists;
    } catch (error) {
      console.error("Error al crear usuario admin:", error);
      throw error;
    }
  }

  async _loadProceresData() {
    try {
      // Verificar si existe el archivo
      await fs.access(this.proceresPath);
      
      // Leer y parsear datos
      const rawData = await fs.readFile(this.proceresPath, 'utf8');
      const { proceres } = JSON.parse(rawData);
      
      if (!Array.isArray(proceres)) {
        throw new Error("Formato inválido: se esperaba un array en 'proceres'");
      }

      // Obtener admin (crear uno si no existe)
      let adminUser = await User.findOne({ role: "admin" });
      if (!adminUser) {
        adminUser = await this._createAdminUser();
      }

      // Procesar en lotes para mejor performance
      const batches = [];
      for (let i = 0; i < proceres.length; i += this.batchSize) {
        batches.push(proceres.slice(i, i + this.batchSize));
      }

      let loadedCount = 0;
      
      for (const batch of batches) {
        const operations = batch.map(procerData => {
          // Validación básica de datos
          const { error } = validateProcerData(procerData);
          if (error) {
            console.warn(`Datos inválidos para ${procerData.nombre || 'prócer'}:`, error.message);
            return null;
          }

          return {
            updateOne: {
              filter: { id: procerData.id },
              update: { 
                $setOnInsert: { 
                  ...procerData,
                  creadoPor: adminUser._id,
                  fechaCreacion: new Date()
                }
              },
              upsert: true
            }
          };
        }).filter(op => op !== null);

        if (operations.length > 0) {
          const result = await Procer.bulkWrite(operations);
          loadedCount += result.upsertedCount;
        }
      }

      console.log(`🦅 ${loadedCount}/${proceres.length} próceres cargados/actualizados`);
      return { loaded: loadedCount, total: proceres.length };
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log("ℹ️  No se encontró archivo de próceres en:", this.proceresPath);
        return { loaded: 0, total: 0 };
      }
      console.error("Error al cargar próceres:", error);
      throw error;
    }
  }
}

module.exports = InitialSetup;