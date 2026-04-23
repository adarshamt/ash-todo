const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const srcDir = path.join(__dirname, '..', 'public', 'screenshots')
const out = async () => {
  try {
    const wideSvg = path.join(srcDir, 'wide.svg')
    const mobileSvg = path.join(srcDir, 'mobile.svg')
    if (!fs.existsSync(wideSvg) || !fs.existsSync(mobileSvg)) {
      console.error('SVG screenshots not found in', srcDir)
      process.exit(1)
    }
    await sharp(wideSvg).png().resize(1280, 720, { fit: 'cover' }).toFile(path.join(srcDir, 'wide.png'))
    await sharp(mobileSvg).png().resize(640, 1136, { fit: 'cover' }).toFile(path.join(srcDir, 'mobile.png'))
    console.log('Converted screenshots to PNG in', srcDir)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

out()
