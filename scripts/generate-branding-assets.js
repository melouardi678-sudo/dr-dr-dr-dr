import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating vector SVG files...');

// 1. Full Vector SVG
const fullSvg = `<svg width="800" height="400" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B2545" />
      <stop offset="100%" stop-color="#1E3A8A" />
    </linearGradient>
    <linearGradient id="aGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#0EA5E9" />
    </linearGradient>
    <linearGradient id="stethGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0369A1" />
      <stop offset="50%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#38BDF8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <g transform="translate(100, 30) scale(1.15)">
    <!-- Letter E -->
    <path d="M 42 58 L 92 58 L 92 78 L 66 78 L 66 94 L 88 94 L 88 114 L 66 114 L 66 132 L 94 132 L 94 152 L 42 152 Z" fill="url(#eGrad)" />

    <!-- Letter A -->
    <path d="M 120 48 L 148 48 L 178 152 L 154 152 L 146 126 L 122 126 L 114 152 L 90 152 Z M 134 76 L 126 108 L 142 108 Z" fill="url(#aGrad)" />

    <!-- Doctor Mortarboard / Academic Cap -->
    <path d="M 134 22 L 168 34 L 134 46 L 100 34 Z" fill="#0F172A" />
    <path d="M 116 41 L 116 52 C 116 55, 152 55, 152 52 L 152 41" fill="#1E293B" />
    <path d="M 158 35 L 164 48 L 162 56" stroke="#0EA5E9" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <circle cx="162" cy="57" r="2.5" fill="#38BDF8" />

    <!-- Stethoscope -->
    <circle cx="34" cy="42" r="4.5" fill="#0284C7" />
    <circle cx="48" cy="42" r="4.5" fill="#0284C7" />
    <path d="M 34 42 C 34 52, 42 62, 42 72" stroke="url(#stethGrad)" stroke-width="4.5" stroke-linecap="round" fill="none" />
    <path d="M 48 42 C 48 52, 42 62, 42 72" stroke="url(#stethGrad)" stroke-width="4.5" stroke-linecap="round" fill="none" />

    <path d="M 42 72 C 30 110, 40 170, 100 174 C 150 178, 180 148, 172 120" stroke="url(#stethGrad)" stroke-width="6.5" stroke-linecap="round" fill="none" />

    <circle cx="172" cy="116" r="13" fill="#0284C7" stroke="#FFFFFF" stroke-width="3" />
    <circle cx="172" cy="116" r="6.5" fill="#0B2545" />

    <!-- ECG Pulse Line -->
    <path d="M 96 112 L 116 112 L 122 96 L 128 126 L 134 102 L 140 116 L 146 112 L 168 112" stroke="#FFFFFF" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#glow)" />
  </g>

  <!-- Primary Text -->
  <text x="400" y="290" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="52" letter-spacing="-1">
    <tspan fill="#0B2545">E-ACCESS </tspan>
    <tspan fill="#0284C7">WEB</tspan>
  </text>

  <!-- Subtitle Text -->
  <line x1="180" y1="330" x2="260" y2="330" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" />
  <text x="400" y="336" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="18" fill="#475569" letter-spacing="4">
    MEDICAL SOFTWARE SOLUTIONS
  </text>
  <line x1="540" y1="330" x2="620" y2="330" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" />
</svg>`;

// 2. Icon SVG
const iconSvg = `<svg width="500" height="500" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="eGradIco" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B2545" />
      <stop offset="100%" stop-color="#1E3A8A" />
    </linearGradient>
    <linearGradient id="aGradIco" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#0EA5E9" />
    </linearGradient>
    <linearGradient id="stethGradIco" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0369A1" />
      <stop offset="50%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#38BDF8" />
    </linearGradient>
    <filter id="glowIco" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Letter E -->
  <path d="M 42 58 L 92 58 L 92 78 L 66 78 L 66 94 L 88 94 L 88 114 L 66 114 L 66 132 L 94 132 L 94 152 L 42 152 Z" fill="url(#eGradIco)" />

  <!-- Letter A -->
  <path d="M 120 48 L 148 48 L 178 152 L 154 152 L 146 126 L 122 126 L 114 152 L 90 152 Z M 134 76 L 126 108 L 142 108 Z" fill="url(#aGradIco)" />

  <!-- Mortarboard Cap -->
  <path d="M 134 22 L 168 34 L 134 46 L 100 34 Z" fill="#0F172A" />
  <path d="M 116 41 L 116 52 C 116 55, 152 55, 152 52 L 152 41" fill="#1E293B" />
  <path d="M 158 35 L 164 48 L 162 56" stroke="#0EA5E9" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <circle cx="162" cy="57" r="2" fill="#38BDF8" />

  <!-- Stethoscope -->
  <circle cx="34" cy="42" r="4" fill="#0284C7" />
  <circle cx="48" cy="42" r="4" fill="#0284C7" />
  <path d="M 34 42 C 34 52, 42 62, 42 72" stroke="url(#stethGradIco)" stroke-width="4" stroke-linecap="round" fill="none" />
  <path d="M 48 42 C 48 52, 42 62, 42 72" stroke="url(#stethGradIco)" stroke-width="4" stroke-linecap="round" fill="none" />

  <path d="M 42 72 C 30 110, 40 170, 100 174 C 150 178, 180 148, 172 120" stroke="url(#stethGradIco)" stroke-width="6" stroke-linecap="round" fill="none" />

  <circle cx="172" cy="116" r="12" fill="#0284C7" stroke="#FFFFFF" stroke-width="2.5" />
  <circle cx="172" cy="116" r="6" fill="#0B2545" />

  <!-- ECG Pulse -->
  <path d="M 96 112 L 116 112 L 122 96 L 128 126 L 134 102 L 140 116 L 146 112 L 168 112" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#glowIco)" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'logo.svg'), fullSvg);
fs.writeFileSync(path.join(publicDir, 'logo-icon.svg'), iconSvg);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), iconSvg);

console.log('Generating transparent PNG assets at all requested resolutions...');

// Draw high precision logo directly on Canvas for high DPI crisp output
function drawLogoToCanvas(width, height, isSquareIcon = false) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);

  if (isSquareIcon) {
    // Scale factor for 200x200 design space
    const s = width / 200;

    // Draw EA Monogram
    // Letter E
    ctx.fillStyle = '#0B2545';
    ctx.beginPath();
    ctx.moveTo(42 * s, 58 * s);
    ctx.lineTo(92 * s, 58 * s);
    ctx.lineTo(92 * s, 78 * s);
    ctx.lineTo(66 * s, 78 * s);
    ctx.lineTo(66 * s, 94 * s);
    ctx.lineTo(88 * s, 94 * s);
    ctx.lineTo(88 * s, 114 * s);
    ctx.lineTo(66 * s, 114 * s);
    ctx.lineTo(66 * s, 132 * s);
    ctx.lineTo(94 * s, 132 * s);
    ctx.lineTo(94 * s, 152 * s);
    ctx.lineTo(42 * s, 152 * s);
    ctx.closePath();
    ctx.fill();

    // Letter A
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.moveTo(120 * s, 48 * s);
    ctx.lineTo(148 * s, 48 * s);
    ctx.lineTo(178 * s, 152 * s);
    ctx.lineTo(154 * s, 152 * s);
    ctx.lineTo(146 * s, 126 * s);
    ctx.lineTo(122 * s, 126 * s);
    ctx.lineTo(114 * s, 152 * s);
    ctx.lineTo(90 * s, 152 * s);
    ctx.closePath();
    ctx.fill();

    // Inner triangle of A
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(134 * s, 76 * s);
    ctx.lineTo(126 * s, 108 * s);
    ctx.lineTo(142 * s, 108 * s);
    ctx.closePath();
    ctx.fill();

    // Mortarboard Cap
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(134 * s, 22 * s);
    ctx.lineTo(168 * s, 34 * s);
    ctx.lineTo(134 * s, 46 * s);
    ctx.lineTo(100 * s, 34 * s);
    ctx.closePath();
    ctx.fill();

    // Stethoscope sweep
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.bezierCurveTo(30 * s, 110 * s, 40 * s, 170 * s, 100 * s, 174 * s);
    ctx.bezierCurveTo(150 * s, 178 * s, 180 * s, 148 * s, 172 * s, 120 * s);
    ctx.stroke();

    // Diaphragm
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(172 * s, 116 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5 * s;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.fillStyle = '#0B2545';
    ctx.beginPath();
    ctx.arc(172 * s, 116 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();

    // ECG Pulse line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5 * s;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(96 * s, 112 * s);
    ctx.lineTo(116 * s, 112 * s);
    ctx.lineTo(122 * s, 96 * s);
    ctx.lineTo(128 * s, 126 * s);
    ctx.lineTo(134 * s, 102 * s);
    ctx.lineTo(140 * s, 116 * s);
    ctx.lineTo(146 * s, 112 * s);
    ctx.lineTo(168 * s, 112 * s);
    ctx.stroke();

  } else {
    // Full banner canvas (e.g. 1024x1024 or ratio)
    const s = width / 1000;

    // Center icon mark at top half
    const iconX = (width - 400 * s) / 2;
    const iconY = 80 * s;

    // Draw E
    ctx.fillStyle = '#0B2545';
    ctx.beginPath();
    ctx.moveTo(iconX + 84 * s, iconY + 116 * s);
    ctx.lineTo(iconX + 184 * s, iconY + 116 * s);
    ctx.lineTo(iconX + 184 * s, iconY + 156 * s);
    ctx.lineTo(iconX + 132 * s, iconY + 156 * s);
    ctx.lineTo(iconX + 132 * s, iconY + 188 * s);
    ctx.lineTo(iconX + 176 * s, iconY + 188 * s);
    ctx.lineTo(iconX + 176 * s, iconY + 228 * s);
    ctx.lineTo(iconX + 132 * s, iconY + 228 * s);
    ctx.lineTo(iconX + 132 * s, iconY + 264 * s);
    ctx.lineTo(iconX + 188 * s, iconY + 264 * s);
    ctx.lineTo(iconX + 188 * s, iconY + 304 * s);
    ctx.lineTo(iconX + 84 * s, iconY + 304 * s);
    ctx.closePath();
    ctx.fill();

    // Draw A
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.moveTo(iconX + 240 * s, iconY + 96 * s);
    ctx.lineTo(iconX + 296 * s, iconY + 96 * s);
    ctx.lineTo(iconX + 356 * s, iconY + 304 * s);
    ctx.lineTo(iconX + 308 * s, iconY + 304 * s);
    ctx.lineTo(iconX + 292 * s, iconY + 252 * s);
    ctx.lineTo(iconX + 244 * s, iconY + 252 * s);
    ctx.lineTo(iconX + 228 * s, iconY + 304 * s);
    ctx.lineTo(iconX + 180 * s, iconY + 304 * s);
    ctx.closePath();
    ctx.fill();

    // Stethoscope sweep
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 12 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.bezierCurveTo(iconX + 60 * s, iconY + 220 * s, iconX + 80 * s, iconY + 340 * s, iconX + 200 * s, iconY + 348 * s);
    ctx.bezierCurveTo(iconX + 300 * s, iconY + 356 * s, iconX + 360 * s, iconY + 296 * s, iconX + 344 * s, iconY + 240 * s);
    ctx.stroke();

    // Cap
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(iconX + 268 * s, iconY + 44 * s);
    ctx.lineTo(iconX + 336 * s, iconY + 68 * s);
    ctx.lineTo(iconX + 268 * s, iconY + 92 * s);
    ctx.lineTo(iconX + 200 * s, iconY + 68 * s);
    ctx.closePath();
    ctx.fill();

    // ECG Line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 7 * s;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(iconX + 192 * s, iconY + 224 * s);
    ctx.lineTo(iconX + 232 * s, iconY + 224 * s);
    ctx.lineTo(iconX + 244 * s, iconY + 192 * s);
    ctx.lineTo(iconX + 256 * s, iconY + 252 * s);
    ctx.lineTo(iconX + 268 * s, iconY + 204 * s);
    ctx.lineTo(iconX + 280 * s, iconY + 232 * s);
    ctx.lineTo(iconX + 292 * s, iconY + 224 * s);
    ctx.lineTo(iconX + 336 * s, iconY + 224 * s);
    ctx.stroke();

    // Main Text "E-ACCESS WEB"
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${105 * s}px sans-serif`;
    
    // Measure text width
    ctx.fillStyle = '#0B2545';
    ctx.fillText('E-ACCESS', width / 2 - 110 * s, height * 0.68);

    ctx.fillStyle = '#0284C7';
    ctx.fillText('WEB', width / 2 + 280 * s, height * 0.68);

    // Subtitle "MEDICAL SOFTWARE SOLUTIONS"
    ctx.font = `bold ${34 * s}px sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText('MEDICAL SOFTWARE SOLUTIONS', width / 2, height * 0.82);

    // Lines
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 420 * s, height * 0.82);
    ctx.lineTo(width / 2 - 320 * s, height * 0.82);
    ctx.moveTo(width / 2 + 320 * s, height * 0.82);
    ctx.lineTo(width / 2 + 420 * s, height * 0.82);
    ctx.stroke();
  }

  return canvas.toBuffer('image/png');
}

// Generate resolutions
const resolutions = [1024, 512, 256, 128, 64, 32, 16];

for (const res of resolutions) {
  // Full logo PNG
  const fullBuf = drawLogoToCanvas(res, res, false);
  fs.writeFileSync(path.join(publicDir, `logo-${res}x${res}.png`), fullBuf);
  fs.writeFileSync(path.join(publicDir, `logo-${res}.png`), fullBuf);

  // Icon PNG
  const icoBuf = drawLogoToCanvas(res, res, true);
  fs.writeFileSync(path.join(publicDir, `logo-icon-${res}x${res}.png`), icoBuf);
  fs.writeFileSync(path.join(publicDir, `logo-icon-${res}.png`), icoBuf);
}

// Default logo.png & logo-icon.png
fs.copyFileSync(path.join(publicDir, 'logo-512.png'), path.join(publicDir, 'logo.png'));
fs.copyFileSync(path.join(publicDir, 'logo-icon-512.png'), path.join(publicDir, 'logo-icon.png'));

// Favicons
fs.copyFileSync(path.join(publicDir, 'logo-icon-32.png'), path.join(publicDir, 'favicon-32x32.png'));
fs.copyFileSync(path.join(publicDir, 'logo-icon-16.png'), path.join(publicDir, 'favicon-16x16.png'));

// Generate valid ICO format header wrapping PNGs (Windows Icon format)
function createIcoFile(pngBuffers) {
  const numImages = pngBuffers.length;
  const headerSize = 6 + numImages * 16;
  
  let totalDataSize = 0;
  for (const buf of pngBuffers) {
    totalDataSize += buf.data.length;
  }

  const icoBuffer = Buffer.alloc(headerSize + totalDataSize);

  // Reserved (2 bytes) = 0, Type (2 bytes) = 1 (ICO), Count (2 bytes)
  icoBuffer.writeUInt16LE(0, 0);
  icoBuffer.writeUInt16LE(1, 2);
  icoBuffer.writeUInt16LE(numImages, 4);

  let currentOffset = headerSize;

  for (let i = 0; i < numImages; i++) {
    const { width, height, data } = pngBuffers[i];
    const entryOffset = 6 + i * 16;

    icoBuffer.writeUInt8(width >= 256 ? 0 : width, entryOffset);
    icoBuffer.writeUInt8(height >= 256 ? 0 : height, entryOffset + 1);
    icoBuffer.writeUInt8(0, entryOffset + 2); // Color palette
    icoBuffer.writeUInt8(0, entryOffset + 3); // Reserved
    icoBuffer.writeUInt16LE(1, entryOffset + 4); // Color planes
    icoBuffer.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
    icoBuffer.writeUInt32LE(data.length, entryOffset + 8); // Image size in bytes
    icoBuffer.writeUInt32LE(currentOffset, entryOffset + 12); // Offset of image data

    data.copy(icoBuffer, currentOffset);
    currentOffset += data.length;
  }

  return icoBuffer;
}

function createIcnsFile(entries) {
  let totalLength = 8;
  for (const entry of entries) {
    totalLength += 8 + entry.data.length;
  }
  const buffer = Buffer.alloc(totalLength);
  buffer.write('icns', 0, 4, 'ascii');
  buffer.writeUInt32BE(totalLength, 4);

  let offset = 8;
  for (const entry of entries) {
    buffer.write(entry.tag, offset, 4, 'ascii');
    buffer.writeUInt32BE(8 + entry.data.length, offset + 4);
    entry.data.copy(buffer, offset + 8);
    offset += 8 + entry.data.length;
  }
  return buffer;
}

const icoPngs = [
  { width: 16, height: 16, data: drawLogoToCanvas(16, 16, true) },
  { width: 32, height: 32, data: drawLogoToCanvas(32, 32, true) },
  { width: 48, height: 48, data: drawLogoToCanvas(48, 48, true) },
  { width: 64, height: 64, data: drawLogoToCanvas(64, 64, true) },
  { width: 256, height: 256, data: drawLogoToCanvas(256, 256, true) },
];

const icoBuffer = createIcoFile(icoPngs);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
fs.writeFileSync(path.join(publicDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(publicDir, 'logo.ico'), icoBuffer);

// macOS ICNS Icon Generation
const icnsEntries = [
  { tag: 'icp4', data: drawLogoToCanvas(16, 16, true) },
  { tag: 'icp5', data: drawLogoToCanvas(32, 32, true) },
  { tag: 'icp6', data: drawLogoToCanvas(64, 64, true) },
  { tag: 'ic07', data: drawLogoToCanvas(128, 128, true) },
  { tag: 'ic08', data: drawLogoToCanvas(256, 256, true) },
  { tag: 'ic09', data: drawLogoToCanvas(512, 512, true) },
  { tag: 'ic10', data: drawLogoToCanvas(1024, 1024, true) },
];
const icnsBuffer = createIcnsFile(icnsEntries);
fs.writeFileSync(path.join(publicDir, 'icon.icns'), icnsBuffer);

// 3. Populate dedicated Electron "build" and "resources/icons" directories
const buildDir = path.resolve(process.cwd(), 'build');
const buildIconsDir = path.join(buildDir, 'icons');
const resourcesIconsDir = path.resolve(process.cwd(), 'resources', 'icons');

[buildDir, buildIconsDir, resourcesIconsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Windows icons
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(buildDir, 'installerHeaderIcon.ico'), icoBuffer);
fs.writeFileSync(path.join(buildDir, 'uninstallerIcon.ico'), icoBuffer);
fs.writeFileSync(path.join(resourcesIconsDir, 'icon.ico'), icoBuffer);

// Master icons for macOS and Linux
fs.writeFileSync(path.join(buildDir, 'icon.icns'), icnsBuffer);
fs.writeFileSync(path.join(resourcesIconsDir, 'icon.icns'), icnsBuffer);
fs.copyFileSync(path.join(publicDir, 'logo-icon-512.png'), path.join(buildDir, 'icon.png'));
fs.copyFileSync(path.join(publicDir, 'logo-icon-1024.png'), path.join(buildDir, 'icon-1024.png'));
fs.copyFileSync(path.join(publicDir, 'logo-icon-512.png'), path.join(resourcesIconsDir, 'icon.png'));
fs.copyFileSync(path.join(publicDir, 'logo-icon-1024.png'), path.join(resourcesIconsDir, 'icon-1024x1024.png'));

// Linux icon set (16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512, 1024x1024)
for (const res of [16, 32, 48, 64, 128, 256, 512, 1024]) {
  const icoData = drawLogoToCanvas(res, res, true);
  fs.writeFileSync(path.join(buildIconsDir, `${res}x${res}.png`), icoData);
  fs.writeFileSync(path.join(resourcesIconsDir, `${res}x${res}.png`), icoData);
}

// Write README for resources/icons folder
fs.writeFileSync(
  path.join(resourcesIconsDir, 'README.md'),
  `# MediCab Desktop Application Icons
Ce dossier contient tous les fichiers d'icônes officiels et professionnels pour le logiciel MediCab :

- **icon.ico** : Format multi-résolutions Windows (16x16, 32x32, 48x48, 64x64, 256x256). Utilisé pour l'exécutable (.exe), le raccourci Bureau, le menu Démarrer et l'installateur NSIS.
- **icon.png** : Format haute définition 512x512 pour macOS, Linux et Web.
- **icon-1024x1024.png** : Format Ultra-HD Retina pour macOS App Bundle et DMG.
- **icons/ (16x16 à 1024x1024)** : Formats standards pour les distributions Linux (deb, rpm, AppImage).
`
);

console.log('All branding assets, build icons and resource folders generated successfully!');
