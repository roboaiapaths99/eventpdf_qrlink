const QRCode = require('../backend/node_modules/qrcode');
const fs = require('fs');
const path = require('path');

const targetUrl = process.argv[2] || 'https://eventpdf-qrlink.vercel.app';
const assetsDir = path.resolve(__dirname, '..', 'frontend', 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const rootPngPath = path.resolve(__dirname, '..', 'technula_kit_qr.png');
const rootSvgPath = path.resolve(__dirname, '..', 'technula_kit_qr.svg');
const assetPngPath = path.join(assetsDir, 'technula_kit_qr.png');
const assetSvgPath = path.join(assetsDir, 'technula_kit_qr.svg');

async function generate() {
  console.log(`\n======================================================`);
  console.log(`🤖 Generating Technula Robotics Kit QR Code...`);
  console.log(`🔗 Target URL: ${targetUrl}`);
  console.log(`======================================================\n`);

  // 1. Generate Terminal QR (can be scanned directly off screen!)
  const terminalString = await QRCode.toString(targetUrl, { type: 'terminal', small: true });
  console.log(terminalString);

  // 2. Generate High-Res PNG (800x800 for crystal-clear stickers)
  try {
    if (fs.existsSync(rootPngPath)) fs.unlinkSync(rootPngPath);
  } catch (e) {}
  await QRCode.toFile(rootPngPath, targetUrl, {
    width: 800,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
  try {
    if (fs.existsSync(assetPngPath)) fs.unlinkSync(assetPngPath);
  } catch (e) {}
  fs.copyFileSync(rootPngPath, assetPngPath);

  // 3. Generate Vector SVG
  const svgString = await QRCode.toString(targetUrl, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
  fs.writeFileSync(rootSvgPath, svgString, 'utf8');
  fs.writeFileSync(assetSvgPath, svgString, 'utf8');

  console.log(`✅ High-Res PNG saved to: ${rootPngPath}`);
  console.log(`✅ Vector SVG saved to:   ${rootSvgPath}`);
  console.log(`✅ Frontend Asset saved:  ${assetPngPath}\n`);
}

generate().catch(err => {
  console.error('QR Generation failed:', err);
});
