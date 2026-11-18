// Generates the PWA icons and the Open Graph card with no image dependencies.
// Run with: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const name = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([len, name, data, crc]);
};

const encodePng = (width, height, rgba) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

// Signed distance to a rounded rectangle centred on the origin.
const sdRoundRect = (px, py, hw, hh, r) => {
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
  );
};

const edgeFn = (ax, ay, bx, by, px, py) =>
  (bx - ax) * (py - ay) - (by - ay) * (px - ax);

const inTriangle = (px, py, a, b, c) => {
  const e0 = edgeFn(a[0], a[1], b[0], b[1], px, py);
  const e1 = edgeFn(b[0], b[1], c[0], c[1], px, py);
  const e2 = edgeFn(c[0], c[1], a[0], a[1], px, py);
  return (e0 >= 0 && e1 >= 0 && e2 >= 0) || (e0 <= 0 && e1 <= 0 && e2 <= 0);
};

const mix = (a, b, t) => a + (b - a) * t;

// Layers the "image" glyph (frame + sun + mountain) inside a brand gradient.
function render(width, height, opts = {}) {
  const { unit = Math.min(width, height), glyph = 0.56, radius = 0 } = opts;
  const size = unit * glyph;
  const half = size / 2;
  const frame = size * 0.16;
  const corner = size * 0.22;

  const sun = [-size * 0.19, -size * 0.19];
  const sunR = size * 0.085;
  const tri = [
    [-size * 0.4, size * 0.3],
    [size * 0.4, size * 0.3],
    [-size * 0.02, -size * 0.14],
  ];

  const outerHalf = half + frame / 2;
  const innerHalf = half - frame / 2;
  const innerCorner = Math.max(0, corner - frame / 2);
  const cx = width / 2;
  const cy = height / 2;
  const bgRadius = radius * unit;

  const rgba = Buffer.alloc(width * height * 4);
  const SS = 3; // supersampling for smooth edges
  const step = 1 / SS;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let glyphCoverage = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + sx * step;
          const py = y + sy * step;

          const local = [px - cx, py - cy];
          const frameD = Math.abs(sdRoundRect(local[0], local[1], outerHalf, outerHalf, corner)) - frame / 2;
          const insideFrame = frameD < 0;
          const sunD = Math.hypot(local[0] - sun[0], local[1] - sun[1]) - sunR;
          const insideSun = sunD < 0;
          // The mountain is clipped to the frame's interior, not to the stroke band.
          const insideInterior =
            sdRoundRect(local[0], local[1], innerHalf, innerHalf, innerCorner) < 0;
          const insideMountain =
            insideInterior && inTriangle(local[0], local[1], tri[0], tri[1], tri[2]);

          if (insideFrame || insideSun || insideMountain) glyphCoverage++;
        }
      }

      glyphCoverage /= SS * SS;

      // Diagonal brand gradient.
      const t = clamp((x / width) * 0.55 + (y / height) * 0.45);
      let r = Math.round(mix(79, 147, t));
      let g = Math.round(mix(70, 51, t));
      let b = Math.round(mix(229, 234, t));

      if (bgRadius > 0) {
        const d = sdRoundRect(x - cx, y - cy, width / 2, height / 2, bgRadius);
        if (d > 0) {
          const a = Math.round(255 * (1 - smoothstep(0, 1.2, d)));
          const i = (y * width + x) * 4;
          rgba[i] = r;
          rgba[i + 1] = g;
          rgba[i + 2] = b;
          rgba[i + 3] = a;
          continue;
        }
      }

      // Glyph drawn in white at 96% opacity over the gradient.
      const gAlpha = glyphCoverage * 0.96;
      r = Math.round(mix(r, 255, gAlpha));
      g = Math.round(mix(g, 255, gAlpha));
      b = Math.round(mix(b, 255, gAlpha));

      const i = (y * width + x) * 4;
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = 255;
    }
  }

  return encodePng(width, height, rgba);
}

const write = (relPath, buffer) => {
  const full = resolve(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, buffer);
  console.log(`${relPath}  ${buffer.length} bytes`);
};

// Standard icons: the glyph fills the square.
write("public/icons/icon-192.png", render(192, 192, { glyph: 0.56 }));
write("public/icons/icon-512.png", render(512, 512, { glyph: 0.56 }));
// Maskable icons must keep their content inside the 80% safe zone.
write("public/icons/maskable-512.png", render(512, 512, { glyph: 0.42 }));
// Social sharing card (1200x630 is the standard large-card ratio).
write("public/og.png", render(1200, 630, { unit: 630, glyph: 0.62 }));
