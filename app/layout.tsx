import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { DataProvider } from '@/hooks/useData'
import { BottomNav } from '@/components/nav/BottomNav'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

// Branding is centralized so the working name can change in one place.
export const APP_NAME = 'Card Desk'

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Comps, team needs, and repack payouts — built for the dealer table.',
  applicationName: APP_NAME,
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: APP_NAME },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#14171c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        <DataProvider>
          <div className="mx-auto min-h-dvh max-w-lg pb-24">{children}</div>
          <BottomNav />
        </DataProvider>
      </body>
    </html>
  )
}
