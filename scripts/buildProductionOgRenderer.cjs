const fs = require('fs');

const { width, height, base64: basePixelsBase64 } = JSON.parse(fs.readFileSync('worker/basePixels.json', 'utf8'));
const fontAtlas = JSON.parse(fs.readFileSync('scripts/fontAtlas.json', 'utf8'));

const code = `// Production Dynamic OG Image Generator for DoxCards Room Embeds
// Uses authentic Plus Jakarta Sans ExtraBold font rasterized glyphs in pure crisp white (#ffffff)
const WIDTH = ${width};
const HEIGHT = ${height};
const BASE64_DEFLATED_PIXELS = "${basePixelsBase64}";
const FONT_ATLAS = ${JSON.stringify(fontAtlas)};

let cachedBasePixels = null;
const cachedMasks = {};

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

async function getGlyphMask(info) {
  if (cachedMasks[info.mask]) return cachedMasks[info.mask];
  const binary = atob(info.mask);
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
  cachedMasks[info.mask] = result;
  return result;
}

function blendPixel(px, width, height, x, y, r, g, b, alpha) {
  if (x < 0 || x >= width || y < 0 || y >= height || alpha <= 0) return;
  const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
  const a = Math.min(1, alpha);
  px[idx] = Math.round(px[idx] * (1 - a) + r * a);
  px[idx + 1] = Math.round(px[idx + 1] * (1 - a) + g * a);
  px[idx + 2] = Math.round(px[idx + 2] * (1 - a) + b * a);
  px[idx + 3] = 255;
}

async function drawRoomCodeWhite(px, width, height, code) {
  const clean = (code || 'RF7K2').toUpperCase().slice(0, 5);
  const letterSpacing = 8;

  // Calculate total advance width
  let totalAdvance = 0;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const info = FONT_ATLAS[ch] || FONT_ATLAS['0'];
    totalAdvance += info.advanceWidth;
    if (i < clean.length - 1) totalAdvance += letterSpacing;
  }

  // Red pill center: X=283, Y=151
  const startX = Math.round(283 - totalAdvance / 2);
  const baselineY = 168; // Baseline for FONT_SIZE=52

  let curX = startX;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const info = FONT_ATLAS[ch] || FONT_ATLAS['0'];
    const mask = await getGlyphMask(info);

    const drawLeft = curX + info.minX;
    const drawTop = baselineY + info.minY;

    for (let my = 0; my < info.h; my++) {
      for (let mx = 0; mx < info.w; mx++) {
        const alphaVal = mask[my * info.w + mx];
        if (alphaVal > 0) {
          const alphaNorm = alphaVal / 255;
          // Pure crisp white (#ffffff)
          blendPixel(px, width, height, drawLeft + mx, drawTop + my, 255, 255, 255, alphaNorm);
        }
      }
    }

    curX += info.advanceWidth + letterSpacing;
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
    await drawRoomCodeWhite(pixels, WIDTH, HEIGHT, roomCode);
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
console.log('Compiled production Plus Jakarta Sans ogRenderer.js successfully!');
