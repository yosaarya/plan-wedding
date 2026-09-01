'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Lima tab, sesuai peta layar di docs/03-DESIGN.md §5.2. */
const TABS = [
  { href: '/beranda', label: 'Beranda' },
  { href: '/checklist', label: 'Checklist' },
  { href: '/anggaran', label: 'Anggaran' },
  { href: '/tamu', label: 'Undangan' },
  { href: '/profil', label: 'Profil' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-cream-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-16 max-w-[480px]">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-medium ${
                  active ? 'text-brand-600' : 'text-ink-500'
                }`}
              >
                <span
                  aria-hidden
                  className={`h-5 w-5 rounded-md ${active ? 'bg-brand-500' : 'bg-ink-300'}`}
                />
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
