'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '../../lib/supabase-browser'

type AdminRole = 'owner' | 'delegate' | 'staff'

interface AdminSidebarProps {
  role: AdminRole
  userName: string
  initials: string
}

const ROLE_BADGE: Record<AdminRole, { bg: string; color: string; label: string }> = {
  owner:    { bg: '#FF5A1F', color: '#FFFFFF', label: 'OWNER' },
  delegate: { bg: '#F5C518', color: '#0B0D0E', label: 'DELEGATE' },
  staff:    { bg: '#2A2F33', color: '#8B9197', label: 'STAFF' },
}

interface NavItem {
  label: string
  href: string
}

function getNavItems(role: AdminRole): NavItem[] {
  const items: NavItem[] = [{ label: 'BOOKINGS', href: '/admin/bookings' }]
  if (role === 'owner' || role === 'delegate') {
    items.push({ label: 'MECHANICS', href: '/admin/mechanics' })
  }
  if (role === 'owner') {
    items.push({ label: 'SETTINGS', href: '/admin/settings' })
  }
  return items
}

export function AdminSidebar({ role, userName, initials }: AdminSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const badge    = ROLE_BADGE[role]
  const navItems = getNavItems(role)

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-full bg-ink2 flex-shrink-0"
        style={{ width: 240, borderRight: '1px solid #2A2F33', zIndex: 40 }}
      >
        {/* Logo */}
        <div className="px-6 pt-8 pb-6" style={{ borderBottom: '1px solid #2A2F33' }}>
          <span className="font-display text-[20px] font-bold text-bone tracking-tighter">
            JK
          </span>
          <span className="font-mono text-[8px] tracking-mono2 uppercase text-steel2 ml-2">
            GARAGE
          </span>
        </div>

        {/* User info */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #2A2F33' }}>
          <div
            className="rounded-full flex items-center justify-center mb-3 flex-shrink-0"
            style={{ width: 36, height: 36, background: '#2A2F33' }}
          >
            <span className="font-display font-bold text-[12px] text-bone select-none">
              {initials}
            </span>
          </div>
          <p className="font-display font-semibold text-[13px] text-bone leading-tight truncate">
            {userName}
          </p>
          <span
            className="font-mono text-[8px] tracking-mono2 uppercase px-1.5 py-0.5 leading-none inline-block mt-1.5"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-6 py-3 transition-colors duration-120"
                style={{
                  color:      isActive ? '#FF5A1F' : '#5C6369',
                  background: isActive ? '#1E2225' : 'transparent',
                  borderLeft: isActive ? '2px solid #FF5A1F' : '2px solid transparent',
                }}
              >
                <span className="font-mono text-[10px] tracking-mono2 uppercase">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-6 py-5" style={{ borderTop: '1px solid #2A2F33' }}>
          <button
            onClick={handleSignOut}
            className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 hover:text-bone transition-colors duration-120"
          >
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <header
        className="flex md:hidden fixed top-0 left-0 right-0 items-center justify-between px-4 bg-ink2"
        style={{ height: 52, borderBottom: '1px solid #2A2F33', zIndex: 40 }}
      >
        <span className="font-display text-[18px] font-bold text-bone tracking-tighter">
          JK
        </span>
        <span
          className="font-mono text-[8px] tracking-mono2 uppercase px-1.5 py-0.5 leading-none"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
        <button
          onClick={handleSignOut}
          className="font-mono text-[9px] tracking-mono2 uppercase text-steel2"
        >
          OUT
        </button>
      </header>

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav
        className="flex md:hidden fixed bottom-0 left-0 right-0 bg-ink2"
        style={{ height: 56, borderTop: '1px solid #2A2F33', zIndex: 40 }}
      >
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex items-center justify-center"
              style={{
                color:     isActive ? '#FF5A1F' : '#5C6369',
                boxShadow: isActive ? 'inset 0 2px 0 #FF5A1F' : 'none',
              }}
            >
              <span className="font-mono text-[9px] tracking-mono uppercase">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
