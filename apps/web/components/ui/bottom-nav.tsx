'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { label: 'HOME', href: '/home' },
  { label: 'BOOK', href: '/book' },
  { label: 'LOG',  href: '/history' },
  { label: 'ME',   href: '/account' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-ink flex"
      style={{ borderTop: '1px solid #2A2F33', height: 64, zIndex: 50 }}
    >
      {ITEMS.map(({ label, href }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex items-center justify-center"
            style={{
              color:     isActive ? '#FF5A1F' : '#5C6369',
              boxShadow: isActive ? 'inset 0 2px 0 #FF5A1F' : 'none',
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="font-mono text-[10px] tracking-mono uppercase">
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
