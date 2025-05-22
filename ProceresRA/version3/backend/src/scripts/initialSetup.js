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
      console.log("🚀 Iniciando proceso de setup...");
      const admin = await this._createAdminUser();
      const loadResult = await this._loadProceresData(admin);
      
      console.log("\n====================================");
      console.log("✅ Setup completado exitosamente");
      console.log(`👤 Admin: ${admin.email}`);
      console.log(`🦅 Próceres: ${loadResult.loaded} de ${loadResult.total} cargados`);
      console.log("====================================\n");
      
      return { success: true, ...loadResult };
    } catch (error) {
      console.error("\n❌ Error durante el setup:", error.message);
      throw error;
    }
  }

  async _createAdminUser() {
    let admin = await User.findOne({ email: this.adminData.email });
    
    if (!admin) {
      this.adminData.password = await bcrypt.hash(this.adminData.password, 12);
      admin = await User.create(this.adminData);
      console.log("👤 Usuario admin creado exitosamente");
    } else {
      console.log("👤 Usuario admin ya existente");
    }
    return admin;
  }

  async _loadProceresData(adminUser) {
    try {
      console.log("\n📂 Buscando archivo de próceres...");
      await fs.access(this.proceresPath);
      const rawData = await fs.readFile(this.proceresPath, 'utf8');
      const { proceres } = JSON.parse(rawData);
      
      if (!Array.isArray(proceres)) {
        throw new Error("Formato inválido: se esperaba un array en 'proceres'");
      }

      console.log(`🦅 Encontrados ${proceres.length} próceres en el archivo`);
      console.log("⏳ Cargando datos...");

      let loadedCount = 0;
      let existingCount = 0;
      let errorCount = 0;

      for (let i = 0; i < proceres.length; i += this.batchSize) {
        const batch = proceres.slice(i, i + this.batchSize);
        const batchResult = await this._processProcerBatch(batch, adminUser._id);
        
        loadedCount += batchResult.loaded;
        existingCount += batchResult.existing;
        errorCount += batchResult.errors;
        
        const progress = Math.min(i + this.batchSize, proceres.length);
        console.log(`🔄 Progreso: ${progress}/${proceres.length} (${Math.round((progress/proceres.length)*100)}%)`);
      }

      return {
        total: proceres.length,
        loaded: loadedCount,
        existing: existingCount,
        errors: errorCount
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log("ℹ️  Archivo de próceres no encontrado en:", this.proceresPath);
        return { total: 0, loaded: 0, existing: 0, errors: 0 };
      }
      throw error;
    }
  }

  async _processProcerBatch(batch, adminId) {
    let loaded = 0;
    let existing = 0;
    let errors = 0;

    const operations = batch.map(procerData => {
      try {
        const cleanData = {
          ...procerData,
          fecha_nacimiento: procerData.fecha_nacimiento ? new Date(procerData.fecha_nacimiento) : null,
          fecha_fallecimiento: procerData.fecha_fallecimiento ? new Date(procerData.fecha_fallecimiento) : null,
          creadoPor: adminId
        };

        return {
          updateOne: {
            filter: { id: procerData.id },
            update: { $setOnInsert: cleanData },
            upsert: true
          }
        };
      } catch (error) {
        errors++;
        console.error(`Error procesando prócer ${procerData.id}:`, error.message);
        return null;
      }
    }).filter(op => op !== null);

    if (operations.length > 0) {
      try {
        const result = await Procer.bulkWrite(operations);
        loaded += result.upsertedCount || 0;
        existing += (result.matchedCount || 0) - (result.modifiedCount || 0);
      } catch (error) {
        errors += operations.length;
        console.error("Error en lote:", error.message);
      }
    }

    return { loaded, existing, errors };
  }
}

module.exports = InitialSetup;