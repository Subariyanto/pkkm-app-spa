// generate-icons.js - generate icon-192.png & icon-512.png (Kemenag green) without external deps.
// Pure Node, writes a minimal valid PNG using zlib + CRC32.

const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(size, drawFn) {
  // RGBA buffer
  const buf = Buffer.alloc(size * size * 4);
  drawFn(buf, size);

  // Add filter byte (0) at start of each row
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    buf.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;     // bit depth
  ihdr[9] = 6;     // color type RGBA
  ihdr[10] = 0;    // compression
  ihdr[11] = 0;    // filter
  ihdr[12] = 0;    // interlace
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function setPx(buf, size, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a;
}

function drawIcon(buf, size) {
  // background: rounded square Kemenag green (#047a3a)
  const r = Math.floor(size * 0.18);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = true;
      // rounded corners
      if (x < r && y < r) inside = (x - r) ** 2 + (y - r) ** 2 <= r * r;
      else if (x >= size - r && y < r) inside = (x - (size - r - 1)) ** 2 + (y - r) ** 2 <= r * r;
      else if (x < r && y >= size - r) inside = (x - r) ** 2 + (y - (size - r - 1)) ** 2 <= r * r;
      else if (x >= size - r && y >= size - r) inside = (x - (size - r - 1)) ** 2 + (y - (size - r - 1)) ** 2 <= r * r;
      if (inside) setPx(buf, size, x, y, 0x04, 0x7a, 0x3a, 0xff);
      else setPx(buf, size, x, y, 0, 0, 0, 0);
    }
  }
  // Draw "PKKM" letters as simple white blocks (3x5 font upscaled)
  const font = {
    'P': ['111','101','111','100','100'],
    'K': ['101','110','100','110','101'],
    'M': ['10101','11111','10101','10101','10101'],
  };
  function letter(grid, ox, oy, scale, color=[255,255,255,255]) {
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === '1') {
          for (let dy = 0; dy < scale; dy++)
            for (let dx = 0; dx < scale; dx++)
              setPx(buf, size, ox + x*scale + dx, oy + y*scale + dy, ...color);
        }
      }
    }
  }
  // total width: P(3)+K(3)+K(3)+M(5) plus 3 gaps of 1
  const scale = Math.max(2, Math.floor(size / 28));
  const gap = scale;
  const widthGlyphs = (3 + 3 + 3 + 5) * scale + 3 * gap;
  const startX = Math.floor((size - widthGlyphs) / 2);
  const startY = Math.floor((size - 5*scale) / 2);
  let x = startX;
  letter(font['P'], x, startY, scale); x += 3*scale + gap;
  letter(font['K'], x, startY, scale); x += 3*scale + gap;
  letter(font['K'], x, startY, scale); x += 3*scale + gap;
  letter(font['M'], x, startY, scale);
}

function write(name, size) {
  const png = makePng(size, drawIcon);
  fs.writeFileSync(name, png);
  console.log(`✓ ${name} (${size}x${size}, ${png.length} bytes)`);
}

write('icon-192.png', 192);
write('icon-512.png', 512);
