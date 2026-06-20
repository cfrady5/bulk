/**
 * Lightweight ID helpers.
 *
 * We avoid a native uuid dependency to keep the MVP running cleanly in Expo Go.
 * These IDs are used as local primary keys; when syncing to Supabase the same
 * UUID strings are stored as the row `id`.
 */

/** RFC4122-ish v4 UUID. Good enough for client-generated primary keys. */
export function uuid(): string {
  // crypto.randomUUID is available on newer RN/Hermes runtimes.
  const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) {
    try {
      return g.crypto.randomUUID();
    } catch {
      // fall through to manual implementation
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** A short, human-friendly id fragment (for SKUs etc.). */
export function shortId(length = 4): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
    .toUpperCase();
}
