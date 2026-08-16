const fs = require('fs');
const zlib = require('zlib');
const opentype = require('opentype.js');

const fontBuf = fs.readFileSync('scripts/PlusJakartaSans-ExtraBold.ttf');
const font = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));
console.log('Font loaded:', font.names?.fontFamily?.en || 'Plus Jakarta Sans');

function decodePNG(buf) {
  let pos = 8, idatChunks = [], width = 0, height = 0;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') { width = buf.readUInt32BE(pos + 8); height = buf.readUInt32BE(pos + 12); }
    else if (type === 'IDAT') { idatChunks.push(buf.subarray(pos + 8, pos + 8 + len)); }
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * 4;
  const pixels = Buffer.alloc(width * height * 4);
  let rawOffset = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rawOffset++];
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 4; c++) {
        const rawByte = raw[rawOffset++];
        const idx = (y * width + x) * 4 + c;
        let a = (x > 0) ? pixels[idx - 4] : 0;
        let b = (y > 0) ? pixels[idx - stride] : 0;
        let c_diag = (x > 0 && y > 0) ? pixels[idx - stride - 4] : 0;
        let val = 0;
        if (filter === 0) val = rawByte;
        else if (filter === 1) val = (rawByte + a) & 0xFF;
        else if (filter === 2) val = (rawByte + b) & 0xFF;
        else if (filter === 3) val = (rawByte + Math.floor((a + b) / 2)) & 0xFF;
        else if (filter === 4) {
          const p = a + b - c_diag;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c_diag);
          let pr = a;
          if (pb < pa && pb < pc) pr = b;
          else if (pc < pa) pr = c_diag;
          val = (rawByte + pr) & 0xFF;
        }
        pixels[idx] = val;
      }
    }
  }
  return { width, height, pixels };
}

function encodePNG(width, height, pixels) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  let rawOffset = 0;
  for (let y = 0; y < height; y++) {
    raw[rawOffset++] = 0;
    pixels.copy(raw, rawOffset, y * stride, (y + 1) * stride);
    rawOffset += stride;
  }
  const idat = zlib.deflateSync(raw, { level: 6 });
  const TABLE = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    TABLE[n] = c;
  }
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, 'ascii');
    let c = 0 ^ (-1);
    const toHash = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < toHash.length; i++) c = (c >>> 8) ^ TABLE[(c ^ toHash[i]) & 0xFF];
    c = (c ^ (-1)) >>> 0;
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(c);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Rasterize glyphs into alpha masks using polygon scanline fill with 4x supersampling for ultra smooth text
const FONT_SIZE = 52;
const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const atlas = {};

for (const ch of chars) {
  const glyph = font.charToGlyph(ch);
  const path = glyph.getPath(0, 0, FONT_SIZE);
  const bb = path.getBoundingBox();

  // Rasterize path into high-res grid
  const pad = 4;
  const minX = Math.floor(bb.x1) - pad;
  const maxX = Math.ceil(bb.x2) + pad;
  const minY = Math.floor(bb.y1) - pad;
  const maxY = Math.ceil(bb.y2) + pad;

  const w = maxX - minX;
  const h = maxY - minY;

  // Convert SVG path commands to polygon segments
  // We can sample points or use point-in-path with supersampling
  const SS = 4; // 4x4 supersampling
  const mask = new Uint8Array(w * h);

  // Collect polylines from path commands
  const polys = [];
  let curPoly = [];
  let curX = 0, curY = 0;

  for (const cmd of path.commands) {
    if (cmd.type === 'M') {
      if (curPoly.length > 0) polys.push(curPoly);
      curPoly = [[cmd.x, cmd.y]];
      curX = cmd.x; curY = cmd.y;
    } else if (cmd.type === 'L') {
      curPoly.push([cmd.x, cmd.y]);
      curX = cmd.x; curY = cmd.y;
    } else if (cmd.type === 'Q') {
      // Quadratic bezier subdivide
      for (let t = 0.1; t <= 1.0; t += 0.1) {
        const it = 1 - t;
        const qx = it * it * curX + 2 * it * t * cmd.x1 + t * t * cmd.x;
        const qy = it * it * curY + 2 * it * t * cmd.y1 + t * t * cmd.y;
        curPoly.push([qx, qy]);
      }
      curX = cmd.x; curY = cmd.y;
    } else if (cmd.type === 'C') {
      // Cubic bezier subdivide
      for (let t = 0.1; t <= 1.0; t += 0.1) {
        const it = 1 - t;
        const cx = it * it * it * curX + 3 * it * it * t * cmd.x1 + 3 * it * t * t * cmd.x2 + t * t * t * cmd.x;
        const cy = it * it * it * curY + 3 * it * it * t * cmd.y1 + 3 * it * t * t * cmd.y2 + t * t * t * cmd.y;
        curPoly.push([cx, cy]);
      }
      curX = cmd.x; curY = cmd.y;
    } else if (cmd.type === 'Z') {
      if (curPoly.length > 0) {
        polys.push(curPoly);
        curPoly = [];
      }
    }
  }
  if (curPoly.length > 0) polys.push(curPoly);

  // Even-odd rule point in polygon test
  function pointInPath(px, py) {
    let inside = false;
    for (const poly of polys) {
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
    }
    return inside;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const pxCoord = (minX + x) + (sx + 0.5) / SS;
          const pyCoord = (minY + y) + (sy + 0.5) / SS;
          if (pointInPath(pxCoord, pyCoord)) hits++;
        }
      }
      mask[y * w + x] = Math.round((hits / (SS * SS)) * 255);
    }
  }

  // Deflate mask to compact base64
  const deflated = zlib.deflateSync(mask, { level: 9 }).toString('base64');

  atlas[ch] = {
    advanceWidth: Math.round(glyph.advanceWidth * (FONT_SIZE / font.unitsPerEm)),
    minX,
    minY,
    w,
    h,
    mask: deflated
  };
}

console.log('Generated glyph atlas for', Object.keys(atlas).length, 'characters.');
fs.writeFileSync('scripts/fontAtlas.json', JSON.stringify(atlas));
