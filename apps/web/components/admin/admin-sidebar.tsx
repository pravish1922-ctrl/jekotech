'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type AdminRole = 'owner' | 'delegate' | 'staff'

interface AdminSidebarProps {
  role: AdminRole
  userName: string
  initials: string
}

const NAV = [
  { href: '/admin/bookings', label: 'Bookings', icon: BookingsIcon, roles: ['owner', 'delegate', 'staff'] },
  { href: '/admin/analytics', label: 'Analytics', icon: AnalyticsIcon, roles: ['owner', 'delegate'] },
  { href: '/admin/mechanics', label: 'Mechanics', icon: MechanicsIcon, roles: ['owner', 'delegate'] },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon, roles: ['owner'] },
]

const ROLE_BADGE: Record<AdminRole, { label: string; bg: string; color: string }> = {
  owner:    { label: 'Owner',    bg: '#FF5A1F', color: '#fff' },
  delegate: { label: 'Delegate', bg: '#F5C518', color: '#0B0D0E' },
  staff:    { label: 'Staff',    bg: '#2A2F33', color: '#F2EFEA' },
}

export function AdminSidebar({ role, userName, initials }: AdminSidebarProps) {
  const pathname = usePathname()
  const badge = ROLE_BADGE[role]
  const visibleNav = NAV.filter(n => n.roles.includes(role))

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{ height: 52, background: '#15181A', borderBottom: '1px solid #2A2F33' }}
      >
        <JKMark />
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5"
            style={{ background: badge.bg, color: badge.color, fontFamily: 'JetBrains Mono, monospace' }}
          >
            {badge.label.toUpperCase()}
          </span>
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-bold"
            style={{ background: '#FF5A1F', color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ──────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
        style={{ background: '#15181A', borderTop: '1px solid #2A2F33', height: 56 }}
      >
        {visibleNav.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1"
              style={{ color: active ? '#FF5A1F' : '#F2EFEA99' }}
            >
              <item.icon size={20} />
              <span className="text-[10px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {item.label.toUpperCase()}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Desktop sidebar ────────────────────────────────────────── */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-full z-50 flex-col"
        style={{ width: 240, background: '#15181A', borderRight: '1px solid #2A2F33' }}
      >
        {/* Logo */}
        <div className="flex items-center px-6 gap-3" style={{ height: 64, borderBottom: '1px solid #2A2F33' }}>
          <JKMark />
          <div>
            <div className="text-xs font-bold" style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.1em' }}>
              JEKOTECH
            </div>
            <div className="text-[10px]" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
              ADMIN PORTAL
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {visibleNav.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: active ? '#FF5A1F1A' : 'transparent',
                  color: active ? '#FF5A1F' : '#F2EFEA99',
                  borderLeft: active ? '2px solid #FF5A1F' : '2px solid transparent',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #2A2F33' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: '#FF5A1F', color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>
                {userName}
              </div>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5"
                style={{ background: badge.bg, color: badge.color, fontFamily: 'JetBrains Mono, monospace' }}
              >
                {badge.label.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

// ── Icons ────────────────────────────────────────────────────────────

function JKMark() {
  return (
    <div
      className="flex items-center justify-center font-black text-sm"
      style={{ width: 32, height: 32, background: '#FF5A1F', color: '#fff', fontFamily: 'Space Grotesk, sans-serif', flexShrink: 0 }}
    >
      JK
    </div>
  )
}

function BookingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="0" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 2v4M13 2v4M3 8h14" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 12h2M11 12h2M7 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function AnalyticsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 15l4-5 3 3 4-6 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MechanicsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M5.05 14.95l1.41-1.41M13.54 6.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function SettingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2.5A7.5 7.5 0 0 1 17.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 17.5A7.5 7.5 0 0 1 2.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17.5 10A7.5 7.5 0 0 1 10 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2.5 10A7.5 7.5 0 0 1 10 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
