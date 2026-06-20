/* Prepares the transparent brand masters for in-app use:
 *   assets/brand/source/icon.png    (app icon, already transparent)
 *   assets/brand/source/lockup.png  (lockup on a solid black block)
 *
 * - icon:   trim transparent margins.
 * - lockup: key out the black background block -> transparent, then trim.
 * Both are downscaled to app-friendly sizes (keeps memory reasonable; the
 * masters stay full-res under assets/brand/source/).
 *
 * Outputs: assets/brand/app-icon.png, assets/brand/logo-lockup.png
 * Usage:   node scripts/clean-brand-images.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.join(__dirname, '..');

/** Make near-black pixels transparent (the lockup's background block). */
function blackKey(p, { hard = 26, soft = 64 } = {}) {
  const { data } = p;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    if (max <= hard) {
      data[i + 3] = 0;
    } else if (max < soft) {
      // feather the anti-aliased edge
      const k = (max - hard) / (soft - hard);
      data[i + 3] = Math.min(data[i + 3], Math.round(255 * k));
    }
  }
}

/** Crop to the bounding box of pixels with alpha > 8 (+ small pad). */
function trim(p, pad = 8) {
  const { width, height, data } = p;
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[((y * width + x) << 2) + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const out = new PNG({ width: cw, height: ch });
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((y + minY) * width + (x + minX)) << 2;
      const di = (y * cw + x) << 2;
      out.data[di] = data[si];
      out.data[di + 1] = data[si + 1];
      out.data[di + 2] = data[si + 2];
      out.data[di + 3] = data[si + 3];
    }
  }
  return out;
}

/** Downscale a transparent PNG (preserving alpha) via resvg, write to disk. */
function writeScaled(p, outPath, maxW, maxH) {
  const ratio = p.width / p.height;
  let w = p.width,
    h = p.height;
  if (w > maxW) {
    w = maxW;
    h = Math.round(w / ratio);
  }
  if (h > maxH) {
    h = maxH;
    w = Math.round(h * ratio);
  }
  const uri = 'data:image/png;base64,' + PNG.sync.write(p).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image x="0" y="0" width="${w}" height="${h}" href="${uri}"/></svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: w },
    background: 'rgba(0,0,0,0)',
  })
    .render()
    .asPng();
  fs.writeFileSync(outPath, png);
  console.log('wrote', path.relative(ROOT, outPath), `${w}x${h}`);
}

// icon: trim only (already transparent)
{
  const p = PNG.sync.read(fs.readFileSync(path.join(ROOT, 'assets', 'brand', 'source', 'icon.png')));
  writeScaled(trim(p), path.join(ROOT, 'assets', 'brand', 'app-icon.png'), 1024, 1024);
}
// lockup: black-key then trim
{
  const p = PNG.sync.read(fs.readFileSync(path.join(ROOT, 'assets', 'brand', 'source', 'lockup.png')));
  blackKey(p);
  writeScaled(trim(p), path.join(ROOT, 'assets', 'brand', 'logo-lockup.png'), 1600, 1600);
}
console.log('done');
