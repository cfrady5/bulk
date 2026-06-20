/* The uploaded brand PNGs have the transparency CHECKERBOARD baked into the
 * background as real pixels (~240/255 grays). Because the logo is white-on-
 * white, the background can't be made transparent without destroying the mark.
 *
 * Instead we UNIFY all near-white / low-saturation pixels to solid white,
 * which removes the checker while leaving the colored cards and dark edges
 * (and the logo's own shading below the threshold) untouched. The result is
 * the exact logo on a clean solid-white background, ready for white "logo
 * plates" on the dark UI.
 *
 * Usage: node scripts/clean-brand-images.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..');

function whitenBackground(srcPath, outPath, { lumThresh = 232, satThresh = 20 } = {}) {
  const p = PNG.sync.read(fs.readFileSync(srcPath));
  const { data } = p;
  let changed = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (lum >= lumThresh && sat <= satThresh) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
      changed++;
    }
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, PNG.sync.write(p));
  console.log(
    'wrote',
    path.relative(ROOT, outPath),
    `${p.width}x${p.height}`,
    'whitened px=',
    changed,
  );
}

whitenBackground(
  path.join(ROOT, 'assets', 'ChatGPT Image Jun 20, 2026, 12_08_44 PM.png'),
  path.join(ROOT, 'assets', 'brand', 'app-icon.png'),
);
whitenBackground(
  path.join(ROOT, 'assets', 'bulk full name.png'),
  path.join(ROOT, 'assets', 'brand', 'logo-lockup.png'),
);
console.log('done');
