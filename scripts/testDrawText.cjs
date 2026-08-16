const fs = require('fs');
const zlib = require('zlib');

const atlas = JSON.parse(fs.readFileSync('scripts/fontAtlas.json', 'utf8'));

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

function blendPixel(px, width, height, x, y, r, g, b, alpha) {
  if (x < 0 || x >= width || y < 0 || y >= height || alpha <= 0) return;
  const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
  const a = Math.min(1, alpha);
  px[idx] = Math.round(px[idx] * (1 - a) + r * a);
  px[idx + 1] = Math.round(px[idx + 1] * (1 - a) + g * a);
  px[idx + 2] = Math.round(px[idx + 2] * (1 - a) + b * a);
  px[idx + 3] = 255;
}

// Draw room code in pure crisp white (#ffffff)
function drawRoomCodeWhite(px, width, height, code) {
  const clean = (code || '6R2SV').toUpperCase().slice(0, 5);
  const letterSpacing = 8;

  // Calculate total advance width
  let totalAdvance = 0;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const info = atlas[ch] || atlas['0'];
    totalAdvance += info.advanceWidth;
    if (i < clean.length - 1) totalAdvance += letterSpacing;
  }

  // Red pill center: X=283, Y=151
  const startX = Math.round(283 - totalAdvance / 2);
  const baselineY = 166; // Baseline for FONT_SIZE=52

  let curX = startX;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const info = atlas[ch] || atlas['0'];
    const mask = zlib.inflateSync(Buffer.from(info.mask, 'base64'));

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

const { width, height, pixels } = decodePNG(fs.readFileSync('public/embed_banner.png'));
const copy = Buffer.from(pixels);
drawRoomCodeWhite(copy, width, height, '6R2SV');
const outPNG = encodePNG(width, height, copy);
fs.writeFileSync('public/test_og.png', outPNG);
console.log('Successfully rendered Plus Jakarta Sans 6R2SV in white!');
