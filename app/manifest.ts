import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Card Desk',
    short_name: 'Card Desk',
    description: 'Comps, team needs, and repack payouts at the dealer table.',
    start_url: '/',
    display: 'standalone',
    background_color: '#14171c',
    theme_color: '#14171c',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
