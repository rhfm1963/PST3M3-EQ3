const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
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
    
    this.proceresPath = path.join(__dirname, '..', 'data', 'proceres.json');
    this.batchSize = 5;
  }
  
  async initialize() {
    try {
      const admin = await this._createAdminUser();
      await this._loadProceresData(admin);
      console.log("✅ Setup completado");
      return { success: true };
    } catch (error) {
      console.error("❌ Error en setup:", error.message);
      throw error;
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

  async _loadProceresData(adminUser) {
    try {
      await fs.access(this.proceresPath);
      const rawData = await fs.readFile(this.proceresPath, 'utf8');
      const { proceres } = JSON.parse(rawData);
      
      if (!Array.isArray(proceres)) {
        throw new Error("Formato inválido: se esperaba un array en 'proceres'");
      }

      console.log(`📂 Encontrados ${proceres.length} próceres en el archivo`);

      let loadedCount = 0;
      for (let i = 0; i < proceres.length; i += this.batchSize) {
        const batch = proceres.slice(i, i + this.batchSize);
        const result = await this._processProcerBatch(batch, adminUser._id);
        loadedCount += result.length;
        console.log(`🔄 Procesados ${i + batch.length}/${proceres.length} próceres`);
      }

      console.log(`🎉 Carga completada: ${loadedCount} próceres cargados`);
      return { total: proceres.length, loaded: loadedCount };
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log("ℹ️  Archivo de próceres no encontrado en:", this.proceresPath);
        return { total: 0, loaded: 0 };
      }
      console.error("Error al cargar próceres:", error.message);
      throw error;
    }
  }

  async _processProcerBatch(batch, adminId) {
    const operations = batch.map(procerData => {
      // Convertir fechas y limpiar campos
      const cleanData = {
        ...procerData,
        fecha_nacimiento: procerData.fecha_nacimiento ? new Date(procerData.fecha_nacimiento) : null,
        fecha_fallecimiento: procerData.fecha_fallecimiento ? new Date(procerData.fecha_fallecimiento) : null,
        creadoPor: adminId
        // Eliminamos las asignaciones manuales de fechas que causan conflicto
      };

      return {
        updateOne: {
          filter: { id: procerData.id },
          update: {
            $setOnInsert: cleanData
          },
          upsert: true
        }
      };
    });

    try {
      const result = await Procer.bulkWrite(operations);
      return result.upsertedCount || 0;
    } catch (error) {
      console.error("Error en batch:", error.message);
      throw error;
    }
  }
}

module.exports = InitialSetup;