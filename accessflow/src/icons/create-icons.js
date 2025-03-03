// This script creates SVG icons which will be used during development
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create simple svg's for each icon size
const sizes = [16, 48, 128];

const svgTemplate = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#4285F4" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="${size * 0.5}px">AF</text>
</svg>`;

// create icons
sizes.forEach(size => {
  const svgContent = svgTemplate(size);
  const fileName = `icon${size}.svg`;
  fs.writeFileSync(path.join(__dirname, fileName), svgContent);
  console.log(`Created ${fileName}`);
});

console.log('Icons created in src/icons directory');
