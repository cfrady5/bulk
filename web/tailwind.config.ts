import type { Config } from 'tailwindcss';

/**
 * bulk web theme — ported from the mobile app's design tokens (theme/colors.ts).
 * Colors are driven by CSS variables (see globals.css) so the whole app is
 * re-themable from one place. Never hardcode hex in components.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        'background-alt': 'hsl(var(--background-alt))',
        surface: 'hsl(var(--surface))',
        'surface-elevated': 'hsl(var(--surface-elevated))',
        'surface-hover': 'hsl(var(--surface-hover))',
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // brand gradient anchors (violet -> electric blue)
        'brand-violet': '#8E73F5',
        'brand-indigo': '#5C5DF0',
        'brand-blue': '#1E47E6',
        // semantic (profit/loss/projection)
        positive: 'hsl(var(--positive))',
        'positive-soft': 'hsl(var(--positive) / 0.14)',
        negative: 'hsl(var(--negative))',
        'negative-soft': 'hsl(var(--negative) / 0.14)',
        warning: 'hsl(var(--warning))',
        'warning-soft': 'hsl(var(--warning) / 0.14)',
      },
      borderRadius: {
        lg: '14px',
        md: '10px',
        sm: '8px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #8E73F5 0%, #5C5DF0 45%, #1E47E6 100%)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
