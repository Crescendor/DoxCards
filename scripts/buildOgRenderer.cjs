const fs = require('fs');
const { width, height, base64 } = JSON.parse(fs.readFileSync('worker/basePixels.json', 'utf8'));

const code = `// Auto-generated OG Image Renderer for DoxCards Room Embeds
const WIDTH = ${width};
const HEIGHT = ${height};
const BASE64_DEFLATED_PIXELS = "${base64}";

let cachedBasePixels = null;

async function getBasePixels() {
  if (cachedBasePixels) return new Uint8Array(cachedBasePixels);
  const binary = atob(BASE64_DEFLATED_PIXELS);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const ds = new DecompressionStream('deflate');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();

  const chunks = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  let totalLen = 0;
  for (const c of chunks) totalLen += c.length;
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  cachedBasePixels = result;
  return new Uint8Array(cachedBasePixels);
}

const VFONT = {
  'A': [[[1,10],[1,3],[5,0],[9,3],[9,10]], [[1,6],[9,6]]],
  'B': [[[1,0],[7,0],[9,2],[9,4.5],[7,5],[1,5],[1,0]], [[1,5],[7,5],[9,7],[9,8.5],[7,10],[1,10],[1,5]]],
  'C': [[[9,2],[7,0],[3,0],[1,2],[1,8],[3,10],[7,10],[9,8]]],
  'D': [[[1,0],[6,0],[9,3],[9,7],[6,10],[1,10],[1,0]]],
  'E': [[[9,0],[1,0],[1,10],[9,10]], [[1,5],[7,5]]],
  'F': [[[9,0],[1,0],[1,10]], [[1,5],[7,5]]],
  'G': [[[9,2],[7,0],[3,0],[1,2],[1,8],[3,10],[7,10],[9,8],[9,5],[5,5]]],
  'H': [[[1,0],[1,10]], [[9,0],[9,10]], [[1,5],[9,5]]],
  'I': [[[2,0],[8,0]], [[5,0],[5,10]], [[2,10],[8,10]]],
  'J': [[[9,0],[9,8],[7,10],[3,10],[1,8],[1,6]]],
  'K': [[[1,0],[1,10]], [[9,0],[1,5],[9,10]]],
  'L': [[[1,0],[1,10],[9,10]]],
  'M': [[[1,10],[1,0],[5,5],[9,0],[9,10]]],
  'N': [[[1,10],[1,0],[9,10],[9,0]]],
  'O': [[[3,0],[7,0],[9,2],[9,8],[7,10],[3,10],[1,8],[1,2],[3,0]]],
  'P': [[[1,10],[1,0],[7,0],[9,2],[9,4],[7,6],[1,6]]],
  'Q': [[[3,0],[7,0],[9,2],[9,8],[7,10],[3,10],[1,8],[1,2],[3,0]], [[6,7],[9,10]]],
  'R': [[[1,10],[1,0],[7,0],[9,2],[9,4],[7,6],[1,6]], [[5,6],[9,10]]],
  'S': [[[9,2],[7,0],[3,0],[1,2],[1,4],[8,6],[9,8],[7,10],[3,10],[1,8]]],
  'T': [[[1,0],[9,0]], [[5,0],[5,10]]],
  'U': [[[1,0],[1,8],[3,10],[7,10],[9,8],[9,0]]],
  'V': [[[1,0],[5,10],[9,0]]],
  'W': [[[1,0],[2.5,10],[5,5],[7.5,10],[9,0]]],
  'X': [[[1,0],[9,10]], [[9,0],[1,10]]],
  'Y': [[[1,0],[5,5],[9,0]], [[5,5],[5,10]]],
  'Z': [[[1,0],[9,0],[1,10],[9,10]]],
  '0': [[[3,0],[7,0],[9,2],[9,8],[7,10],[3,10],[1,8],[1,2],[3,0]], [[2,8],[8,2]]],
  '1': [[[2,3],[5,0],[5,10]], [[2,10],[8,10]]],
  '2': [[[1,2],[3,0],[7,0],[9,2],[9,4],[1,10],[9,10]]],
  '3': [[[1,1],[3,0],[7,0],[9,2],[9,4],[6,5],[9,6],[9,8],[7,10],[3,10],[1,9]]],
  '4': [[[7,10],[7,0],[1,6],[9,6]]],
  '5': [[[9,0],[1,0],[1,4.5],[7,4.5],[9,6.5],[9,8.5],[7,10],[3,10],[1,8.5]]],
  '6': [[[8,1],[5,0],[2,2],[1,5],[1,8],[3,10],[7,10],[9,8],[9,5],[7,4],[1,5]]],
  '7': [[[1,0],[9,0],[4,10]]],
  '8': [[[4,0],[6,0],[8,1.5],[8,3.5],[6,5],[4,5],[2,3.5],[2,1.5],[4,0]], [[4,5],[6,5],[8,6.5],[8,8.5],[6,10],[4,10],[2,8.5],[2,6.5],[4,5]]],
  '9': [[[9,5],[3,6],[1,5],[1,2],[3,0],[7,0],[9,2],[9,8],[7,10],[4,10]]]
};

function blendPixel(px, width, height, x, y, r, g, b, alpha) {
  if (x < 0 || x >= width || y < 0 || y >= height || alpha <= 0) return;
  const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
  const a = Math.min(1, alpha);
  px[idx] = Math.round(px[idx] * (1 - a) + r * a);
  px[idx + 1] = Math.round(px[idx + 1] * (1 - a) + g * a);
  px[idx + 2] = Math.round(px[idx + 2] * (1 - a) + b * a);
  px[idx + 3] = 255;
}

function drawThickLine(px, width, height, x0, y0, x1, y1, thickness) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist * 2));
  const r = thickness / 2;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const cx = x0 + dx * t;
    const cy = y0 + dy * t;
    const minX = Math.floor(cx - r - 1);
    const maxX = Math.ceil(cx + r + 1);
    const minY = Math.floor(cy - r - 1);
    const maxY = Math.ceil(cy + r + 1);
    for (let py = minY; py <= maxY; py++) {
      for (let pxCoord = minX; pxCoord <= maxX; pxCoord++) {
        const d = Math.hypot(pxCoord - cx, py - cy);
        if (d <= r) {
          blendPixel(px, width, height, pxCoord, py, 0, 0, 0, 1.0);
        } else if (d < r + 1.0) {
          blendPixel(px, width, height, pxCoord, py, 0, 0, 0, r + 1.0 - d);
        }
      }
    }
  }
}

function drawVectorChar(px, width, height, ch, startX, startY, charW, charH, strokeThickness) {
  const glyph = VFONT[ch.toUpperCase()] || VFONT['0'];
  for (const stroke of glyph) {
    for (let i = 0; i < stroke.length - 1; i++) {
      const p0 = stroke[i];
      const p1 = stroke[i + 1];
      const x0 = startX + (p0[0] / 10) * charW;
      const y0 = startY + (p0[1] / 10) * charH;
      const x1 = startX + (p1[0] / 10) * charW;
      const y1 = startY + (p1[1] / 10) * charH;
      drawThickLine(px, width, height, x0, y0, x1, y1, strokeThickness);
    }
  }
}

function drawRoomCodeVector(px, width, height, code) {
  const clean = (code || 'RF7K2').toUpperCase().slice(0, 5);
  const charW = 28;
  const charH = 44;
  const spacing = 12;
  const strokeThickness = 6.5;
  const totalW = clean.length * charW + (clean.length - 1) * spacing;

  const centerX = 283;
  const centerY = 151;

  const startX = Math.round(centerX - totalW / 2);
  const startY = Math.round(centerY - charH / 2);

  for (let i = 0; i < clean.length; i++) {
    drawVectorChar(px, width, height, clean[i], startX + i * (charW + spacing), startY, charW, charH, strokeThickness);
  }
}

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c;
}

function makeChunk(type, data) {
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, data.length);
  const typeBytes = new Uint8Array([type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)]);

  let c = 0 ^ (-1);
  for (let i = 0; i < 4; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ typeBytes[i]) & 0xFF];
  for (let i = 0; i < data.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ data[i]) & 0xFF];
  c = (c ^ (-1)) >>> 0;

  const crcBytes = new Uint8Array(4);
  new DataView(crcBytes.buffer).setUint32(0, c);

  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  chunk.set(len, 0);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  chunk.set(crcBytes, 8 + data.length);
  return chunk;
}

export async function generateRoomOgPng(roomCode) {
  const pixels = await getBasePixels();
  if (roomCode) {
    drawRoomCodeVector(pixels, WIDTH, HEIGHT, roomCode);
  }

  const stride = WIDTH * 4;
  const raw = new Uint8Array((stride + 1) * HEIGHT);
  let rawOffset = 0;
  for (let y = 0; y < HEIGHT; y++) {
    raw[rawOffset++] = 0;
    raw.set(pixels.subarray(y * stride, (y + 1) * stride), rawOffset);
    rawOffset += stride;
  }

  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  writer.write(raw);
  writer.close();

  const idatChunks = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    idatChunks.push(value);
  }

  let idatLen = 0;
  for (const c of idatChunks) idatLen += c.length;
  const idatData = new Uint8Array(idatLen);
  let idatOffset = 0;
  for (const c of idatChunks) {
    idatData.set(c, idatOffset);
    idatOffset += c.length;
  }

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, WIDTH);
  ihdrView.setUint32(4, HEIGHT);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const pngSig = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', new Uint8Array(0));

  const totalLength = pngSig.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const png = new Uint8Array(totalLength);
  let p = 0;
  png.set(pngSig, p); p += pngSig.length;
  png.set(ihdrChunk, p); p += ihdrChunk.length;
  png.set(idatChunk, p); p += idatChunk.length;
  png.set(iendChunk, p);

  return png;
}
`;

fs.mkdirSync('functions/api', { recursive: true });
fs.writeFileSync('worker/ogRenderer.js', code);
fs.writeFileSync('functions/api/ogRenderer.js', code);
console.log('Successfully generated ogRenderer.js in worker and functions/api!');
