const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

async function createARMarker(text, name, userId) {
  const markerId = uuidv4();
  const outputDir = path.join(__dirname, '../../public/markers');
  const outputPath = path.join(outputDir, `${name}-${markerId}.patt`);
  
  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generar imagen base para el marcador
  const svgImage = `
    <svg width="500" height="500">
      <rect width="500" height="500" fill="#ffffff"/>
      <text x="50%" y="50%" font-family="Arial" font-size="40" text-anchor="middle" fill="#000000">${text}</text>
    </svg>
  `;

  // Convertir SVG a PNG y guardar
  await sharp(Buffer.from(svgImage))
    .png()
    .toFile(outputPath);

  return `/markers/${name}-${markerId}.patt`;
}

module.exports = { createARMarker };