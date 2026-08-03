import type { Metadata } from 'next';

import { AppShell } from '@/components/app-shell';

import './globals.css';

export const metadata: Metadata = {
  title: 'bulk — Card Inventory & Break Profitability',
  description:
    'Track cost basis, valuations, sales profit, and sports-card break profitability.',
  icons: { icon: '/brand/app-icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
