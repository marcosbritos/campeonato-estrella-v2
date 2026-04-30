const sharp = require('sharp');
const path = require('path');

const logo = path.join(__dirname, '..', 'public', 'logo.png');
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const publicDir = path.join(__dirname, '..', 'public');

async function generate() {
  // Get logo metadata
  const meta = await sharp(logo).metadata();
  const logoW = meta.width;
  const logoH = meta.height;

  // --- PWA Icons (logo centered on dark background) ---
  for (const size of [192, 512]) {
    const padding = Math.round(size * 0.1);
    const logoSize = size - padding * 2;
    
    const resizedLogo = await sharp(logo)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 10, g: 10, b: 20, alpha: 255 } }
    })
      .composite([{ input: resizedLogo, gravity: 'centre' }])
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
    
    console.log(`Generated icon-${size}.png`);
  }

  // --- Apple Touch Icon (180x180) ---
  const appleSize = 180;
  const applePad = Math.round(appleSize * 0.1);
  const appleLogoSize = appleSize - applePad * 2;

  const appleResized = await sharp(logo)
    .resize(appleLogoSize, appleLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: appleSize, height: appleSize, channels: 4, background: { r: 10, g: 10, b: 20, alpha: 255 } }
  })
    .composite([{ input: appleResized, gravity: 'centre' }])
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  
  console.log('Generated apple-touch-icon.png');

  // --- Favicon 32x32 ---
  await sharp(logo)
    .resize(32, 32, { fit: 'contain', background: { r: 10, g: 10, b: 20, alpha: 255 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  
  console.log('Generated favicon.png');

  // --- OG Image for WhatsApp (1200x630) ---
  const ogW = 1200;
  const ogH = 630;
  const ogLogoSize = 320;

  const ogResized = await sharp(logo)
    .resize(ogLogoSize, ogLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Create gradient background with logo centered
  const ogBg = await sharp({
    create: { width: ogW, height: ogH, channels: 4, background: { r: 8, g: 8, b: 18, alpha: 255 } }
  })
    .composite([
      { input: ogResized, gravity: 'centre' }
    ])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));

  console.log('Generated og-image.png');
  console.log('Done!');
}

generate().catch(console.error);
