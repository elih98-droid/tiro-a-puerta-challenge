'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * components/layout/nav-links.tsx
 *
 * Tab bar navigation for the game section.
 * Client Component — needs usePathname() to highlight the active tab.
 *
 * Rendered inside the GameLayout server component. The visual design here
 * is intentionally functional (not final) — a full redesign happens in tarea 8.
 */

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/pick',      label: 'Pick' },
  { href: '/my-picks',  label: 'Mis picks' },
  { href: '/leaderboard', label: 'Leaderboard' },
] as const

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex border-b border-gray-200 bg-white overflow-x-auto">
      {NAV_ITEMS.map(({ href, label }) => {
        // usePathname() returns only the path, no query string — so
        // /pick?date=2026-04-26 correctly highlights the Pick tab.
        const isActive = pathname === href

        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
            ].join(' ')}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
