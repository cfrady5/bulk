/**
 * Minimal base64 -> Uint8Array decoder.
 *
 * React Native / Hermes does not reliably provide `atob`, and turning a local
 * file URI into a Blob via fetch() is flaky on some platforms. Reading the file
 * as base64 (expo-file-system) and decoding here is the most robust path for
 * uploading binary photo data to Supabase Storage.
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const LOOKUP = (() => {
  const table = new Uint8Array(256);
  for (let i = 0; i < CHARS.length; i++) {
    table[CHARS.charCodeAt(i)] = i;
  }
  return table;
})();

export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const byteLength = (len * 3) / 4 - padding;
  const bytes = new Uint8Array(byteLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = LOOKUP[clean.charCodeAt(i)];
    const e2 = LOOKUP[clean.charCodeAt(i + 1)];
    const e3 = LOOKUP[clean.charCodeAt(i + 2)];
    const e4 = LOOKUP[clean.charCodeAt(i + 3)];

    if (p < byteLength) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < byteLength) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < byteLength) bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }

  return bytes;
}
