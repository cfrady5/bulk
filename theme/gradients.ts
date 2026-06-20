/**
 * Brand gradients — the violet→electric-blue identity from the bulk logo cards,
 * plus a silver "gloss" for white/silver surfaces. Use with expo-linear-gradient.
 *
 *   import { LinearGradient } from 'expo-linear-gradient';
 *   <LinearGradient colors={gradients.brand} {...gradients.diagonal} />
 */

export const gradients = {
  /** Violet → indigo → electric blue (matches the stacked logo cards). */
  brand: ['#8E73F5', '#5C5DF0', '#1E47E6'] as const,
  /** Two-stop accent for smaller elements (icons, rings, chips). */
  accent: ['#9A7CFF', '#3D74FF'] as const,
  /** Glossy white→silver for premium light surfaces. */
  glossWhite: ['#FFFFFF', '#EDF0F6', '#C7CEDC'] as const,
  /** Soft brand glow → transparent (for halos behind marks). */
  glow: ['rgba(110,139,255,0.22)', 'rgba(110,139,255,0)'] as const,

  /** Common direction presets for <LinearGradient>. */
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
} as const;

export type Gradients = typeof gradients;
