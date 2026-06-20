/* Generates real app assets + the brand board from the uploaded brand images:
 *   assets/bulk full name.png      (3:1 logo lockup, transparent)
 *   assets/ChatGPT Image ....png   (1:1 3D app icon, transparent)
 *
 * Outputs:
 *   assets/icon.png            1024  opaque dark, icon centered (iOS/Android)
 *   assets/adaptive-icon.png   1024  transparent, icon in Android safe zone
 *   assets/favicon.png          256  opaque dark, icon centered (web)
 *   assets/splash.png      1242x2436 opaque dark, lockup centered
 *   brand/brand-bulk.png   3100      brand board rebuilt with the real images
 *
 * Usage: node scripts/generate-brand-assets.js
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.join(__dirname, '..');
// Clean-named copies of the uploaded brand art (white background intact).
const ICON_SRC = path.join(ROOT, 'assets', 'brand', 'app-icon.png');
const LOCK_SRC = path.join(ROOT, 'assets', 'brand', 'logo-lockup.png');

const dataUri = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
const ICON = dataUri(ICON_SRC);
const LOCK = dataUri(LOCK_SRC);

const rr = (x, y, w, h, r, attrs = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" ${attrs}/>`;
const img = (href, x, y, w, h, par = 'xMidYMid meet') =>
  `<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${par}" href="${href}"/>`;

function render(svg, outPath, widthPx, { background } = {}) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: widthPx },
    font: { loadSystemFonts: true, defaultFontFamily: 'Liberation Sans' },
    background: background || 'rgba(0,0,0,0)',
  });
  fs.writeFileSync(outPath, resvg.render().asPng());
  console.log('wrote', path.relative(ROOT, outPath), `${widthPx}px`);
}

// ---------------------------------------------------------------- app icon
function appIcon() {
  // The brand art has a white background, so the launcher icon is a clean white
  // tile with the b + cards (the OS rounds the corners). Full-bleed cover.
  const S = 1024;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <rect width="${S}" height="${S}" fill="#FFFFFF"/>
    ${img(ICON, 0, 0, S, S, 'xMidYMid slice')}
  </svg>`;
  render(svg, path.join(ROOT, 'assets', 'icon.png'), S, { background: '#FFFFFF' });
}

// ---------------------------------------------------------------- adaptive (Android)
function adaptiveIcon() {
  // White safe-zone foreground (app.json sets adaptive backgroundColor #FFFFFF).
  // Keep the mark within the inner ~70% so Android's mask never clips it.
  const S = 1024;
  const box = S * 0.7;
  const off = (S - box) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <rect width="${S}" height="${S}" fill="#FFFFFF"/>
    ${img(ICON, off, off, box, box)}
  </svg>`;
  render(svg, path.join(ROOT, 'assets', 'adaptive-icon.png'), S, { background: '#FFFFFF' });
}

// ---------------------------------------------------------------- favicon (web)
function favicon() {
  const S = 256;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <rect width="${S}" height="${S}" fill="#FFFFFF"/>
    ${img(ICON, 0, 0, S, S, 'xMidYMid slice')}
  </svg>`;
  render(svg, path.join(ROOT, 'assets', 'favicon.png'), S, { background: '#FFFFFF' });
}

// ---------------------------------------------------------------- splash
function splash() {
  // Dark premium splash with the lockup on a white "logo plate".
  const W = 1242,
    H = 2436;
  const lockW = W * 0.6;
  const lockH = lockW / 3; // lockup is 3:1
  const padH = lockW * 0.08;
  const padV = lockH * 0.5;
  const plateW = lockW + padH * 2;
  const plateH = lockH + padV * 2;
  const px = (W - plateW) / 2;
  const py = (H - plateH) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <radialGradient id="g" cx="0.5" cy="0.42" r="0.55">
        <stop offset="0" stop-color="#26285e" stop-opacity="0.55"/>
        <stop offset="1" stop-color="#0a0a0c" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#0A0B0D"/>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    ${rr(px, py, plateW, plateH, plateH * 0.3, 'fill="#FFFFFF"')}
    ${img(LOCK, px + padH, py + padV, lockW, lockH)}
  </svg>`;
  render(svg, path.join(ROOT, 'assets', 'splash.png'), W, { background: '#0A0B0D' });
}

// ---------------------------------------------------------------- brand board
function featureIcon(type, cx, cy) {
  const s =
    'stroke="url(#iconGrad)" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const sf = 'fill="url(#iconGrad)"';
  if (type === 'layers')
    return `<g transform="translate(${cx} ${cy})">
      <path d="M 0 -16 L 20 -5 L 0 6 L -20 -5 Z" ${s}/>
      <path d="M -20 2 L 0 13 L 20 2" ${s}/>
      <path d="M -20 9 L 0 20 L 20 9" ${s}/></g>`;
  if (type === 'bolt')
    return `<g transform="translate(${cx} ${cy})">
      <path d="M 5 -20 L -9 4 L 0 4 L -4 20 L 11 -4 L 1 -4 Z" ${sf} stroke="url(#iconGrad)" stroke-width="2" stroke-linejoin="round"/></g>`;
  if (type === 'grid') {
    const c = 'fill="none" stroke="url(#iconGrad)" stroke-width="3.4"';
    return `<g transform="translate(${cx} ${cy})">
      ${rr(-18, -18, 15, 15, 4, c)}${rr(4, -18, 15, 15, 4, c)}
      ${rr(-18, 4, 15, 15, 4, c)}${rr(4, 4, 15, 15, 4, c)}</g>`;
  }
  return `<g transform="translate(${cx} ${cy})">
    <circle cx="0" cy="0" r="19" ${s}/><path d="M -8 0 L -2 7 L 9 -7" ${s}/></g>`;
}

function feature(cx, type, label, sub) {
  return `${featureIcon(type, cx, 700)}
    <text x="${cx}" y="767" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans" font-weight="700"
          font-size="21" letter-spacing="2.5" fill="#D7DAE2">${label}</text>
    <text x="${cx}" y="795" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans"
          font-size="18" fill="#787E89">${sub}</text>`;
}

function iconTile(x, y, size, idn) {
  // The brand art is white-bg, so the app-icon tile is a clean white tile.
  const r = size * 0.235;
  return (
    rr(x, y, size, size, r, `fill="#FFFFFF"`) +
    `<clipPath id="clip${idn}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}"/></clipPath>` +
    `<g clip-path="url(#clip${idn})">${img(ICON, x, y, size, size, 'xMidYMid slice')}</g>` +
    rr(x + 0.75, y + 0.75, size - 1.5, size - 1.5, r - 1, `fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"`)
  );
}

function statusIcons(x, y) {
  const bars = [10, 14, 18, 22]
    .map((h, i) => `<rect x="${x + i * 7}" y="${y + (22 - h)}" width="4.5" height="${h}" rx="1.5" fill="#FFFFFF"/>`)
    .join('');
  const wifi = `<g transform="translate(${x + 40} ${y + 4})" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round">
      <path d="M 0 6 A 14 14 0 0 1 24 6"/><path d="M 5 11 A 8 8 0 0 1 19 11"/>
      <circle cx="12" cy="17" r="1.6" fill="#FFFFFF" stroke="none"/></g>`;
  const batt = `<g transform="translate(${x + 74} ${y + 2})">
      <rect x="0" y="0" width="34" height="18" rx="4.5" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2"/>
      <rect x="35.5" y="6" width="2.8" height="6" rx="1.4" fill="rgba(255,255,255,0.55)"/>
      <rect x="2.5" y="2.5" width="25" height="13" rx="2.5" fill="#FFFFFF"/></g>`;
  return bars + wifi + batt;
}

function phoneMockup() {
  const cx = 980,
    cy = 1120;
  const px = 705,
    py = 868,
    pw = 470,
    ph = 560,
    pr = 78;
  const inset = 14;
  const sx = px + inset,
    sy = py + inset,
    sw = pw - inset * 2,
    sh = ph - inset * 2,
    sr = pr - inset;
  const tileSize = 112;
  const tileX = sx + sw / 2 - tileSize / 2;
  const tileY = sy + sh * 0.32;
  return `<g transform="rotate(-7 ${cx} ${cy})">
    ${rr(px, py, pw, ph, pr, `fill="url(#phoneFrame)"`)}
    ${rr(px + 4, py + 4, pw - 8, ph - 8, pr - 4, `fill="#0a0a0c"`)}
    <clipPath id="screenClip">${rr(sx, sy, sw, sh, sr, '')}</clipPath>
    <g clip-path="url(#screenClip)">
      ${rr(sx, sy, sw, sh, sr, `fill="#0b0d16"`)}
      <ellipse cx="${sx + sw / 2}" cy="${sy + sh * 0.42}" rx="${sw * 0.7}" ry="${sh * 0.5}" fill="url(#phoneGlow)"/>
      ${rr(sx + sw / 2 - 52, sy + 26, 104, 34, 17, `fill="#000000"`)}
      <circle cx="${sx + sw / 2 + 34}" cy="${sy + 43}" r="7" fill="#0c0c18"/>
      <text x="${sx + 34}" y="${sy + 52}" font-family="Liberation Sans, DejaVu Sans" font-weight="700" font-size="26" fill="#FFFFFF">9:41</text>
      ${statusIcons(sx + sw - 122, sy + 30)}
      ${iconTile(tileX, tileY, tileSize, 'phone')}
      <text x="${sx + sw / 2}" y="${tileY + tileSize + 30}" text-anchor="middle"
            font-family="Liberation Sans, DejaVu Sans" font-weight="500" font-size="22" fill="#FFFFFF">bulk</text>
    </g>
  </g>`;
}

function brandBoard() {
  const W = 1240,
    H = 1240;
  // top lockup on a white "logo plate"
  const lockW = 600,
    lockH = lockW / 3,
    padH = 56,
    padV = 78;
  const plateW = lockW + padH * 2,
    plateH = lockH + padV * 2,
    plateX = (W - plateW) / 2,
    plateY = 175;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
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
      <stop offset="0" stop-color="#9A7CFF"/><stop offset="1" stop-color="#3D74FF"/>
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
      <stop offset="0" stop-color="#3a3d44"/><stop offset="0.5" stop-color="#16181c"/><stop offset="1" stop-color="#2a2d33"/>
    </linearGradient>
    <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="22" stdDeviation="26" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
    <filter id="logoShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="#0c0c0e"/>
  <rect width="${W}" height="${H}" fill="url(#bgGlow)"/>
  <rect x="0" y="828" width="620" height="${H - 828}" fill="#0a0a0d"/>
  <rect x="620" y="828" width="${W - 620}" height="${H - 828}" fill="#070709"/>

  <!-- top lockup (real image) on a white logo plate -->
  <g filter="url(#logoShadow)">
    ${rr(plateX, plateY, plateW, plateH, plateH * 0.3, 'fill="#FFFFFF"')}
    ${img(LOCK, plateX + padH, plateY + padV, lockW, lockH)}
  </g>

  <line x1="150" y1="632" x2="1090" y2="632" stroke="rgba(255,255,255,0.10)" stroke-width="1.4"/>

  ${feature(267.5, 'layers', 'BATCH', 'List in bulk')}
  ${feature(502.5, 'bolt', 'SPEED', 'Save time')}
  ${feature(737.5, 'grid', 'ORGANIZE', 'Stay organized')}
  ${feature(972.5, 'check', 'LIST', 'Get listed')}
  <line x1="385" y1="678" x2="385" y2="812" stroke="rgba(255,255,255,0.08)" stroke-width="1.2"/>
  <line x1="620" y1="678" x2="620" y2="812" stroke="rgba(255,255,255,0.08)" stroke-width="1.2"/>
  <line x1="855" y1="678" x2="855" y2="812" stroke="rgba(255,255,255,0.08)" stroke-width="1.2"/>

  <ellipse cx="300" cy="1180" rx="170" ry="34" fill="url(#tileFloor)"/>
  <g filter="url(#softShadow)">${iconTile(184, 905, 232, 'left')}</g>

  ${phoneMockup()}

  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
  fs.mkdirSync(path.join(ROOT, 'brand'), { recursive: true });
  render(svg, path.join(ROOT, 'brand', 'brand-bulk.png'), W * 2.5);
}

appIcon();
adaptiveIcon();
favicon();
splash();
brandBoard();
console.log('done');
