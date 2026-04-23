const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'public', 'ash-todo-logo.png')
const outDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

async function gen() {
  try {
    await sharp(src).resize(192, 192, { fit: 'cover' }).png().toFile(path.join(outDir, 'icon-192.png'))
    await sharp(src).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(outDir, 'icon-512.png'))
    // maskable can be same size; designers should trim padding for true maskable
    await sharp(src).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(outDir, 'maskable-512.png'))
    console.log('Generated icons in', outDir)
  } catch (err) {
    console.error('Failed to generate icons:', err)
    process.exit(1)
  }
}

gen()
