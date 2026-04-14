const fs = require('fs');
const path = require('path');

// SVG icon content for PrintBoss
const iconSvg = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#080f18"/>
  <polygon points="${size*0.5},${size*0.18} ${size*0.75},${size*0.62} ${size*0.25},${size*0.62}" fill="#22d0e4" opacity="0.9"/>
  <polygon points="${size*0.5},${size*0.38} ${size*0.68},${size*0.72} ${size*0.32},${size*0.72}" fill="#0ea5e9" opacity="0.7"/>
  <rect x="${size*0.3}" y="${size*0.72}" width="${size*0.4}" height="${size*0.08}" rx="${size*0.04}" fill="#22d0e4" opacity="0.5"/>
</svg>`;

const iconsDir = path.join(__dirname, 'public/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'icon-192.svg'), iconSvg(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.svg'), iconSvg(512));

console.log('SVG icons created. Convert to PNG with: npx sharp-cli or similar.');
