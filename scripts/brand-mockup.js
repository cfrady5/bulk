/* Generates the "bulk" premium brand board as a high-res PNG (vector -> raster).
 * Usage: node scripts/brand-mockup.js [outScale]
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const W = 1240;
const H = 1240;
const OUT_SCALE = Number(process.argv[2] || 2);

// ---------------------------------------------------------------- helpers
const rr = (x, y, w, h, r, attrs = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" ${attrs}/>`;

// The reusable b + stacked-cards mark, authored in a ~360 x 360 local box.
// Returns a <g> already transformed by `transform`.
function bMark(transform, opts = {}) {
  const idp = opts.idp || 'm';
  const cw = 150,
    ch = 188,
    rx = 30;
  // front card top-left; deeper cards step down-right and get darker.
  const cards = [];
  const dx = 13,
    dy = 15;
  const fills = [
    `#1b3fb0`, // back (darkest)
    `#274fce`,
    `#3a63e6`,
  ];
  for (let i = 3; i >= 1; i--) {
    const x = 96 + dx * i;
    const y = 44 + dy * i;
    cards.push(
      rr(x, y, cw, ch, rx, `fill="${fills[3 - i] || '#1b3fb0'}"`) +
        rr(x, y, cw, ch, rx, `fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"`),
    );
  }
  // front card with the violet->blue gradient
  const fx = 96,
    fy = 44;
  const frontCard =
    rr(fx, fy, cw, ch, rx, `fill="url(#${idp}CardGrad)"`) +
    rr(fx, fy, cw, ch, rx, `fill="url(#${idp}CardSheen)"`) +
    rr(fx + 1, fy + 1, cw - 2, ch - 2, rx - 1, `fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"`);

  // glossy white lowercase b (stem + ring bowl), counter open so card shows through
  const sw = 42;
  const stemX = 70;
  const bTop = 30;
  const bBot = 256;
  const ringCx = stemX + 73; // ~143
  const ringCy = bBot - 73; // ~183
  const rOut = 73;
  const b =
    `<g>` +
    // soft contact shadow of the b on the card
    `<g filter="url(#${idp}BShadow)">` +
    rr(stemX - sw / 2, bTop, sw, bBot - bTop, sw / 2, `fill="#000"`) +
    `<circle cx="${ringCx}" cy="${ringCy}" r="${rOut - sw / 2}" fill="none" stroke="#000" stroke-width="${sw}"/>` +
    `</g>` +
    rr(stemX - sw / 2, bTop, sw, bBot - bTop, sw / 2, `fill="url(#${idp}White)"`) +
    `<circle cx="${ringCx}" cy="${ringCy}" r="${rOut - sw / 2}" fill="none" stroke="url(#${idp}White)" stroke-width="${sw}"/>` +
    `</g>`;

  return `<g transform="${transform}">${cards.join('')}${frontCard}${b}</g>`;
}

// gradients/filters scoped per id prefix so we can reuse the mark at different sizes
function markDefs(idp, glossAngle = true) {
  return `
  <linearGradient id="${idp}CardGrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8E73F5"/>
    <stop offset="0.42" stop-color="#5C5DF0"/>
    <stop offset="1" stop-color="#1E47E6"/>
  </linearGradient>
  <linearGradient id="${idp}CardSheen" x1="0" y1="0" x2="0.2" y2="1">
    <stop offset="0" stop-color="rgba(255,255,255,0.35)"/>
    <stop offset="0.35" stop-color="rgba(255,255,255,0.05)"/>
    <stop offset="1" stop-color="rgba(255,255,255,0)"/>
  </linearGradient>
  <linearGradient id="${idp}White" x1="0" y1="0" x2="0.15" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/>
    <stop offset="0.5" stop-color="#F0F2F7"/>
    <stop offset="1" stop-color="#CBD2DF"/>
  </linearGradient>
  <filter id="${idp}BShadow" x="-40%" y="-40%" width="180%" height="190%">
    <feOffset dx="6" dy="12"/>
    <feGaussianBlur stdDeviation="9"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
  </filter>`;
}

// ---------------------------------------------------------------- wordmark
// Hand-built rounded geometric lowercase "bulk" (no font dependency).
function wordmark(x, y, scale, fill) {
  const sw = 46;
  const xh = 150; // x-height
  const asc = 210; // baseline (tops at 0)
  let cx = 0;
  const parts = [];
  // vertical stems as rounded rects (gradient-safe bbox) with explicit fill
  const stem = (sx, top, bot) =>
    rr(sx - sw / 2, top, sw, bot - top, sw / 2, `fill="${fill}" stroke="none"`);

  // b
  {
    const sx = cx + sw / 2;
    parts.push(stem(sx, 0, asc));
    const r = xh / 2;
    parts.push(`<circle cx="${sx + r}" cy="${asc - r}" r="${r - sw / 2}" fill="none"/>`);
    cx = sx + r + r + 30; // advance past bowl + gap
  }
  // u
  {
    const sx = cx + sw / 2;
    const wu = 104;
    const rc = 52;
    parts.push(
      `<path d="M ${sx} ${asc - xh} L ${sx} ${asc - rc} Q ${sx} ${asc} ${sx + rc} ${asc} L ${sx + wu - rc} ${asc} Q ${sx + wu} ${asc} ${sx + wu} ${asc - rc} L ${sx + wu} ${asc - xh}" fill="none"/>`,
    );
    cx = sx + wu + sw / 2 + 30;
  }
  // l
  {
    const sx = cx + sw / 2;
    parts.push(stem(sx, 0, asc));
    cx = sx + sw / 2 + 30;
  }
  // k
  {
    const sx = cx + sw / 2;
    parts.push(stem(sx, 0, asc));
    const j = asc - xh * 0.46; // junction on stem
    parts.push(`<path d="M ${sx + 96} ${asc - xh} L ${sx + 8} ${j}" fill="none"/>`);
    parts.push(`<path d="M ${sx + 12} ${j} L ${sx + 104} ${asc}" fill="none"/>`);
    cx = sx + 104 + sw / 2;
  }

  return `<g transform="translate(${x} ${y}) scale(${scale})"
            stroke="${fill}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none">
            ${parts.join('')}
          </g>`;
}

// ---------------------------------------------------------------- feature icons (line)
function featureIcon(type, cx, cy) {
  const s = 'stroke="url(#iconGrad)" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const sf = 'fill="url(#iconGrad)"';
  if (type === 'layers') {
    return `<g transform="translate(${cx} ${cy})">
      <path d="M 0 -16 L 20 -5 L 0 6 L -20 -5 Z" ${s}/>
      <path d="M -20 2 L 0 13 L 20 2" ${s}/>
      <path d="M -20 9 L 0 20 L 20 9" ${s}/>
    </g>`;
  }
  if (type === 'bolt') {
    return `<g transform="translate(${cx} ${cy})">
      <path d="M 5 -20 L -9 4 L 0 4 L -4 20 L 11 -4 L 1 -4 Z" ${sf} stroke="url(#iconGrad)" stroke-width="2" stroke-linejoin="round"/>
    </g>`;
  }
  if (type === 'grid') {
    const c = 'fill="none" stroke="url(#iconGrad)" stroke-width="3.4"';
    return `<g transform="translate(${cx} ${cy})">
      ${rr(-18, -18, 15, 15, 4, c)}
      ${rr(4, -18, 15, 15, 4, c)}
      ${rr(-18, 4, 15, 15, 4, c)}
      ${rr(4, 4, 15, 15, 4, c)}
    </g>`;
  }
  // check
  return `<g transform="translate(${cx} ${cy})">
    <circle cx="0" cy="0" r="19" ${s}/>
    <path d="M -8 0 L -2 7 L 9 -7" ${s}/>
  </g>`;
}

function feature(cx, type, label, sub) {
  return `
    ${featureIcon(type, cx, 700)}
    <text x="${cx}" y="767" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans" font-weight="700"
          font-size="21" letter-spacing="2.5" fill="#D7DAE2">${label}</text>
    <text x="${cx}" y="795" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans"
          font-size="18" fill="#787E89">${sub}</text>`;
}

// ---------------------------------------------------------------- app icon tile
function appIconTile(x, y, size) {
  const r = size * 0.235;
  // scale the mark (≈360 local) to fit inside with padding
  const pad = size * 0.16;
  const inner = size - pad * 2;
  const markScale = inner / 360;
  const tx = x + pad - 10 * markScale;
  const ty = y + pad - 6 * markScale;
  return (
    `<g>` +
    rr(x, y, size, size, r, `fill="#0c0c0f"`) +
    rr(x, y, size, size, r, `fill="url(#tileSheen)"`) +
    rr(x + 1, y + 1, size - 2, size - 2, r - 1, `fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1.5"`) +
    `<clipPath id="tileClip${Math.round(x)}_${Math.round(y)}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}"/></clipPath>` +
    `<g clip-path="url(#tileClip${Math.round(x)}_${Math.round(y)})">` +
    bMark(`translate(${tx} ${ty}) scale(${markScale})`, { idp: 'm' }) +
    `</g>` +
    `</g>`
  );
}

// ---------------------------------------------------------------- build SVG
function buildSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${markDefs('m')}
    <radialGradient id="bgGlow" cx="0.5" cy="0.30" r="0.55">
      <stop offset="0" stop-color="#2a2c66" stop-opacity="0.55"/>
      <stop offset="0.45" stop-color="#16183a" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#0a0a0c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.55"/>
    </radialGradient>
    <linearGradient id="iconGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9A7CFF"/>
      <stop offset="1" stop-color="#3D74FF"/>
    </linearGradient>
    <linearGradient id="wordWhite" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#EDF0F6"/>
      <stop offset="1" stop-color="#C4CBD9"/>
    </linearGradient>
    <linearGradient id="tileSheen" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="rgba(120,130,200,0.18)"/>
      <stop offset="0.4" stop-color="rgba(255,255,255,0)"/>
      <stop offset="1" stop-color="rgba(0,0,0,0.25)"/>
    </linearGradient>
    <radialGradient id="tileFloor" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#4636c0" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#4636c0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="phoneGlow" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0" stop-color="#2b2f7a" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#0a0a0c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="phoneFrame" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3a3d44"/>
      <stop offset="0.5" stop-color="#16181c"/>
      <stop offset="1" stop-color="#2a2d33"/>
    </linearGradient>
    <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="22" stdDeviation="26" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
    <filter id="logoShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- background -->
  <rect width="${W}" height="${H}" fill="#0c0c0e"/>
  <rect width="${W}" height="${H}" fill="url(#bgGlow)"/>

  <!-- bottom panels base + divider lines -->
  <rect x="0" y="828" width="${W}" height="${H - 828}" fill="#08080a"/>
  <rect x="0" y="828" width="620" height="${H - 828}" fill="#0a0a0d"/>
  <rect x="620" y="828" width="${W - 620}" height="${H - 828}" fill="#070709"/>

  <!-- ===== TOP: logo lockup ===== -->
  <g filter="url(#logoShadow)">
    ${bMark('translate(214 214) scale(0.86)', { idp: 'm' })}
  </g>
  ${wordmark(560, 274, 0.82, 'url(#wordWhite)')}

  <!-- ===== divider above features ===== -->
  <line x1="150" y1="632" x2="1090" y2="632" stroke="rgba(255,255,255,0.10)" stroke-width="1.4"/>

  <!-- ===== feature row ===== -->
  ${feature(267.5, 'layers', 'BATCH', 'List in bulk')}
  ${feature(502.5, 'bolt', 'SPEED', 'Save time')}
  ${feature(737.5, 'grid', 'ORGANIZE', 'Stay organized')}
  ${feature(972.5, 'check', 'LIST', 'Get listed')}
  <line x1="385" y1="678" x2="385" y2="812" stroke="rgba(255,255,255,0.08)" stroke-width="1.2"/>
  <line x1="620" y1="678" x2="620" y2="812" stroke="rgba(255,255,255,0.08)" stroke-width="1.2"/>
  <line x1="855" y1="678" x2="855" y2="812" stroke="rgba(255,255,255,0.08)" stroke-width="1.2"/>

  <!-- ===== bottom-left: standalone app icon ===== -->
  <ellipse cx="300" cy="1180" rx="170" ry="34" fill="url(#tileFloor)"/>
  <g filter="url(#softShadow)">
    ${appIconTile(184, 905, 232)}
  </g>

  <!-- ===== bottom-right: phone mockup ===== -->
  ${phoneMockup()}

  <!-- global vignette on top -->
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
  return svg;
}

function phoneMockup() {
  // phone drawn upright then rotated; cropped by canvas edge
  const cx = 980,
    cy = 1120;
  const px = 705,
    py = 868,
    pw = 470,
    ph = 560,
    pr = 78;
  const inner = 14;
  const sx = px + inner,
    sy = py + inner,
    sw = pw - inner * 2,
    sh = ph - inner * 2,
    sr = pr - inner;
  return `<g transform="rotate(-7 ${cx} ${cy})">
    <!-- frame -->
    ${rr(px, py, pw, ph, pr, `fill="url(#phoneFrame)"`)}
    ${rr(px + 4, py + 4, pw - 8, ph - 8, pr - 4, `fill="#0a0a0c"`)}
    <!-- screen -->
    <clipPath id="screenClip">${rr(sx, sy, sw, sh, sr, '')}</clipPath>
    <g clip-path="url(#screenClip)">
      ${rr(sx, sy, sw, sh, sr, `fill="#0b0d16"`)}
      <ellipse cx="${sx + sw / 2}" cy="${sy + sh * 0.42}" rx="${sw * 0.7}" ry="${sh * 0.5}" fill="url(#phoneGlow)"/>
      <!-- dynamic island -->
      ${rr(sx + sw / 2 - 52, sy + 26, 104, 34, 17, `fill="#000000"`)}
      <circle cx="${sx + sw / 2 + 34}" cy="${sy + 43}" r="7" fill="#0c0c18"/>
      <!-- status bar -->
      <text x="${sx + 34}" y="${sy + 52}" font-family="Liberation Sans, DejaVu Sans" font-weight="700" font-size="26" fill="#FFFFFF">9:41</text>
      ${statusIcons(sx + sw - 122, sy + 30)}
      <!-- home screen app icon + label -->
      ${appIconTile(sx + sw / 2 - 56, sy + sh * 0.34, 112)}
      <text x="${sx + sw / 2}" y="${sy + sh * 0.34 + 112 + 30}" text-anchor="middle"
            font-family="Liberation Sans, DejaVu Sans" font-weight="500" font-size="22" fill="#FFFFFF">bulk</text>
    </g>
  </g>`;
}

function statusIcons(x, y) {
  // signal bars, wifi, battery
  const bars = [10, 14, 18, 22]
    .map((h, i) => `<rect x="${x + i * 7}" y="${y + (22 - h)}" width="4.5" height="${h}" rx="1.5" fill="#FFFFFF"/>`)
    .join('');
  const wifi = `<g transform="translate(${x + 40} ${y + 4}) " fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round">
      <path d="M 0 6 A 14 14 0 0 1 24 6"/>
      <path d="M 5 11 A 8 8 0 0 1 19 11"/>
      <circle cx="12" cy="17" r="1.6" fill="#FFFFFF" stroke="none"/>
    </g>`;
  const batt = `<g transform="translate(${x + 74} ${y + 2})">
      <rect x="0" y="0" width="34" height="18" rx="4.5" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2"/>
      <rect x="35.5" y="6" width="2.8" height="6" rx="1.4" fill="rgba(255,255,255,0.55)"/>
      <rect x="2.5" y="2.5" width="25" height="13" rx="2.5" fill="#FFFFFF"/>
    </g>`;
  return bars + wifi + batt;
}

// render
const svg = buildSvg();
fs.writeFileSync(path.join(__dirname, '..', 'brand-bulk.svg'), svg);
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: W * OUT_SCALE },
  font: { loadSystemFonts: true, defaultFontFamily: 'Liberation Sans' },
  background: 'rgba(0,0,0,0)',
});
const png = resvg.render().asPng();
fs.writeFileSync(path.join(__dirname, '..', 'brand-bulk.png'), png);
console.log('wrote brand-bulk.png', `${W * OUT_SCALE}x${H * OUT_SCALE}`);
