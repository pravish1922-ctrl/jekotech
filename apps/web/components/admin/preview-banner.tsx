'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const AUTH_PATHS = ['/login', '/signup', '/otp', '/forgot', '/auth']

export function PreviewBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show on auth pages (login, signup, otp, forgot)
    if (AUTH_PATHS.some(p => pathname.startsWith(p))) return
    // Don't show inside iframe (admin preview phone mockup)
    if (window.self !== window.top) return

    const hasPreview = document.cookie.split(';').some(c => c.trim().startsWith('preview_mode=true'))
    setVisible(hasPreview)
  }, [pathname])

  function exitPreview() {
    document.cookie = 'preview_mode=; max-age=0; path=/'
    setVisible(false)
    router.push('/admin/bookings')
  }

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-2"
      style={{ background: '#FF5A1F', minHeight: 36 }}
    >
      <span
        className="text-xs font-bold"
        style={{ color: '#fff', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}
      >
        PREVIEW MODE — viewing as customer
      </span>
      <button
        onClick={exitPreview}
        className="text-xs font-bold px-3 py-1 flex-shrink-0"
        style={{
          background: '#0B0D0E',
          color: '#FF5A1F',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.05em',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        EXIT PREVIEW
      </button>
    </div>
  )
}
