'use client';

import {
  Boxes,
  LayoutDashboard,
  Layers,
  PlayCircle,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  History,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { href: '/sales', label: 'Sales', icon: Tags },
  { href: '/breaks/builder', label: 'Break Builder', icon: Layers },
  { href: '/breaks/active', label: 'Active Breaks', icon: PlayCircle },
  { href: '/breaks/history', label: 'Break History', icon: History },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background-alt lg:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/app-icon.png" alt="bulk" className="h-8 w-8" />
        <span className="text-lg font-semibold tracking-tight">bulk</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-surface-elevated text-foreground'
                  : 'text-muted-foreground hover:bg-surface hover:text-foreground',
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-muted-foreground">
        Inventory &amp; Break Profitability
      </div>
    </aside>
  );
}

/** Compact bottom navigation for mobile (spec §3). */
export function MobileNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) =>
    ['/', '/inventory', '/sales', '/breaks/builder', '/reports'].includes(i.href),
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background-alt/95 backdrop-blur lg:hidden">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[11px]',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label.split(' ')[0]}
          </Link>
        );
      })}
    </nav>
  );
}
