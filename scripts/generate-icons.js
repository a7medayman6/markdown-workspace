const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const root = path.resolve(__dirname, '..')
const assetsDir = path.join(root, 'assets')
const linuxIconsDir = path.join(assetsDir, 'icons')

fs.mkdirSync(assetsDir, { recursive: true })
fs.mkdirSync(linuxIconsDir, { recursive: true })

function crc32(buffer) {
  let crc = -1
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  const checksum = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, checksum])
}

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function mix(a, b, t) {
  return a + (b - a) * t
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16)
  ]
}

function roundedRectAlpha(x, y, w, h, r, px, py) {
  const dx = Math.max(Math.abs(px - (x + w / 2)) - w / 2 + r, 0)
  const dy = Math.max(Math.abs(py - (y + h / 2)) - h / 2 + r, 0)
  const outside = Math.hypot(dx, dy) - r
  return clamp(1 - outside, 0, 1)
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4)
  const bg = hexToRgb('#0A0A09')
  const panelTop = hexToRgb('#2B2A26')
  const panelBottom = hexToRgb('#0D0C0B')
  const cream = hexToRgb('#FFF1D1')
  const gold = hexToRgb('#FFD899')

  const outerRadius = size * 0.25
  const panelInset = size * 0.078125
  const panelRadius = size * 0.1875

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4
      const outer = roundedRectAlpha(0, 0, size, size, outerRadius, x + 0.5, y + 0.5)
      if (outer <= 0) continue

      pixels[index] = bg[0]
      pixels[index + 1] = bg[1]
      pixels[index + 2] = bg[2]
      pixels[index + 3] = clamp(outer * 255)

      const panel = roundedRectAlpha(
        panelInset,
        panelInset,
        size - panelInset * 2,
        size - panelInset * 2,
        panelRadius,
        x + 0.5,
        y + 0.5
      )

      if (panel > 0) {
        const t = y / size
        pixels[index] = clamp(mix(panelTop[0], panelBottom[0], t))
        pixels[index + 1] = clamp(mix(panelTop[1], panelBottom[1], t))
        pixels[index + 2] = clamp(mix(panelTop[2], panelBottom[2], t))
        pixels[index + 3] = 255
      }

      const glowDistance = Math.hypot(x - size * 0.34, y - size * 0.27)
      const glow = Math.max(0, 1 - glowDistance / (size * 0.34)) * 0.32
      if (glow > 0 && panel > 0) {
        pixels[index] = clamp(mix(pixels[index], gold[0], glow))
        pixels[index + 1] = clamp(mix(pixels[index + 1], gold[1], glow))
        pixels[index + 2] = clamp(mix(pixels[index + 2], gold[2], glow))
      }
    }
  }

  function fillRect(x, y, w, h, color) {
    const x0 = Math.floor(x * size)
    const y0 = Math.floor(y * size)
    const x1 = Math.ceil((x + w) * size)
    const y1 = Math.ceil((y + h) * size)
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const index = (py * size + px) * 4
        pixels[index] = color[0]
        pixels[index + 1] = color[1]
        pixels[index + 2] = color[2]
        pixels[index + 3] = 255
      }
    }
  }

  function fillPolygon(points, color) {
    const scaled = points.map(([x, y]) => [x * size, y * size])
    const minY = Math.max(0, Math.floor(Math.min(...scaled.map((p) => p[1]))))
    const maxY = Math.min(size - 1, Math.ceil(Math.max(...scaled.map((p) => p[1]))))

    for (let y = minY; y <= maxY; y++) {
      const intersections = []
      for (let i = 0; i < scaled.length; i++) {
        const [x1, y1] = scaled[i]
        const [x2, y2] = scaled[(i + 1) % scaled.length]
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
          intersections.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1))
        }
      }
      intersections.sort((a, b) => a - b)
      for (let i = 0; i < intersections.length; i += 2) {
        const start = Math.max(0, Math.floor(intersections[i]))
        const end = Math.min(size - 1, Math.ceil(intersections[i + 1]))
        for (let x = start; x <= end; x++) {
          const index = (y * size + x) * 4
          pixels[index] = color[0]
          pixels[index + 1] = color[1]
          pixels[index + 2] = color[2]
          pixels[index + 3] = 255
        }
      }
    }
  }

  const leftX = 62 / 256
  const topY = 78 / 256
  const bottomY = 178 / 256
  const stemW = 29 / 256
  fillRect(leftX, topY, stemW, bottomY - topY, cream)
  fillRect(165 / 256, topY, stemW, bottomY - topY, cream)
  fillPolygon([[91 / 256, topY], [128 / 256, 136.5 / 256], [117.5 / 256, 166 / 256], [91 / 256, 123.5 / 256]], cream)
  fillPolygon([[165 / 256, topY], [128 / 256, 136.5 / 256], [138.5 / 256, 166 / 256], [165 / 256, 123.5 / 256]], cream)

  return pixels
}

function pngFromRgba(width, height, rgba) {
  const scanlines = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    const sourceStart = y * width * 4
    const targetStart = y * (width * 4 + 1)
    scanlines[targetStart] = 0
    rgba.copy(scanlines, targetStart + 1, sourceStart, sourceStart + width * 4)
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

function makeIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + images.length * 16
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16)
    entry[0] = size >= 256 ? 0 : size
    entry[1] = size >= 256 ? 0 : size
    entry[2] = 0
    entry[3] = 0
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += png.length
    return entry
  })

  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)])
}

function makeIcns(images) {
  const typeBySize = new Map([
    [16, 'icp4'],
    [32, 'icp5'],
    [64, 'icp6'],
    [128, 'ic07'],
    [256, 'ic08'],
    [512, 'ic09'],
    [1024, 'ic10']
  ])

  const entries = images
    .filter((image) => typeBySize.has(image.size))
    .map((image) => {
      const data = image.png
      const entry = Buffer.alloc(8)
      entry.write(typeBySize.get(image.size), 0, 4, 'ascii')
      entry.writeUInt32BE(data.length + 8, 4)
      return Buffer.concat([entry, data])
    })

  const header = Buffer.alloc(8)
  header.write('icns', 0, 4, 'ascii')
  header.writeUInt32BE(8 + entries.reduce((sum, entry) => sum + entry.length, 0), 4)
  return Buffer.concat([header, ...entries])
}

const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
const pngs = sizes.map((size) => {
  const png = pngFromRgba(size, size, drawIcon(size))
  fs.writeFileSync(path.join(linuxIconsDir, `${size}x${size}.png`), png)
  if (size === 256) fs.writeFileSync(path.join(assetsDir, 'icon.png'), png)
  return { size, png }
})

fs.writeFileSync(
  path.join(assetsDir, 'icon.ico'),
  makeIco(pngs.filter((image) => image.size <= 256))
)
fs.writeFileSync(path.join(assetsDir, 'icon.icns'), makeIcns(pngs))

console.log('Generated app icons in assets/')
