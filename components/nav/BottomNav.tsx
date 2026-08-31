'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  ClipboardList,
  MoreHorizontal,
  ShoppingCart,
  Target,
} from 'lucide-react'
import clsx from 'clsx'

const TABS = [
  { href: '/', label: 'Buy', icon: ShoppingCart },
  { href: '/needs', label: 'Needs', icon: Target },
  { href: '/purchases', label: 'Purchases', icon: ClipboardList },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/more', label: 'More', icon: MoreHorizontal },
] as const

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-white' : 'text-white/45 hover:text-white/70',
              )}
            >
              <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
