// Generates the app icon set as PNGs, with no image dependencies:
// shapes are rasterised with 3x3 supersampling, then encoded via zlib.
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// ---------- PNG encoding ----------
const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- geometry ----------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const BRAND_TOP = hex('#FF9A4D');
const BRAND_BOTTOM = hex('#DE5A0C');
const CREAM = hex('#FFF7EE');
const DARK = hex('#2A1608');
const EAR_INNER = hex('#E8641A');

function tri(ax, ay, bx, by, cx, cy) {
  const sign = (px, py, x1, y1, x2, y2) => (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  return (x, y) => {
    const d1 = sign(x, y, ax, ay, bx, by);
    const d2 = sign(x, y, bx, by, cx, cy);
    const d3 = sign(x, y, cx, cy, ax, ay);
    const neg = d1 < 0 || d2 < 0 || d3 < 0;
    const pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  };
}

const circle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

/** The fox mark, in a 1024-unit square. Layered back to front. */
function foxLayers() {
  return [
    // Ears meet the head exactly on its top edge (y=330), so no cream wedge
    // pokes out past the silhouette.
    { test: tri(200, 330, 286, 132, 440, 330), color: CREAM },   // left ear
    { test: tri(824, 330, 738, 132, 584, 330), color: CREAM },   // right ear
    // Inner ear sits fully above the head edge, or the head would cover it.
    { test: tri(258, 328, 296, 206, 386, 328), color: EAR_INNER },
    { test: tri(766, 328, 728, 206, 638, 328), color: EAR_INNER },
    { test: tri(200, 330, 824, 330, 512, 812), color: CREAM },   // head
    { test: circle(400, 468, 32), color: DARK },                 // eyes
    { test: circle(624, 468, 32), color: DARK },
    { test: tri(474, 604, 550, 604, 512, 680), color: DARK },    // snout
  ];
}

const SS = 3; // supersampling factor per axis

/**
 * @param opts.background 'gradient' | 'none'
 * @param opts.silhouette when true, every fox layer is drawn in one flat color
 * @param opts.scale       fox size relative to the canvas (adaptive icons crop)
 */
function render(size, opts) {
  const { background = 'gradient', silhouette = null, scale = 1 } = opts;
  const rgba = Buffer.alloc(size * size * 4);
  const layers = foxLayers();
  const offset = (1 - scale) / 2;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = (px + (sx + 0.5) / SS) / size;
          const fy = (py + (sy + 0.5) / SS) / size;

          let sr = 0, sg = 0, sb = 0, sa = 0;
          if (background === 'gradient') {
            sr = BRAND_TOP[0] + (BRAND_BOTTOM[0] - BRAND_TOP[0]) * fy;
            sg = BRAND_TOP[1] + (BRAND_BOTTOM[1] - BRAND_TOP[1]) * fy;
            sb = BRAND_TOP[2] + (BRAND_BOTTOM[2] - BRAND_TOP[2]) * fy;
            sa = 255;
          }

          // Fox coordinates, mapped through the scale/offset box.
          const ux = ((fx - offset) / scale) * 1024;
          const uy = ((fy - offset) / scale) * 1024;
          if (ux >= 0 && ux <= 1024 && uy >= 0 && uy <= 1024) {
            for (const layer of layers) {
              if (layer.test(ux, uy)) {
                const color = silhouette ?? layer.color;
                sr = color[0]; sg = color[1]; sb = color[2]; sa = 255;
              }
            }
          }

          r += sr; g += sg; b += sb; a += sa;
        }
      }

      const n = SS * SS;
      const i = (py * size + px) * 4;
      rgba[i] = Math.round(r / n);
      rgba[i + 1] = Math.round(g / n);
      rgba[i + 2] = Math.round(b / n);
      rgba[i + 3] = Math.round(a / n);
    }
  }

  return encodePng(size, size, rgba);
}

// ---------- outputs ----------
const out = process.argv[2];
const write = (name, buf) => {
  fs.writeFileSync(path.join(out, name), buf);
  console.log(name, buf.length, 'bytes');
};

write('icon.png', render(1024, {}));
write('favicon.png', render(64, {}));
write('android-icon-foreground.png', render(1024, { background: 'none', scale: 0.62 }));
write('android-icon-background.png', render(1024, { background: 'gradient', scale: 0 }));
write('android-icon-monochrome.png', render(1024, { background: 'none', scale: 0.62, silhouette: [255, 255, 255] }));
write('splash-icon.png', render(512, { background: 'none', scale: 0.92 }));
