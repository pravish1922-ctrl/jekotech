import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function AdminPreviewPage() {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  const { data: clientRow } = await db
    .from('clients')
    .select('role')
    .eq('id', user.id)
    .single()

  if (clientRow?.role !== 'owner') redirect('/admin/bookings')

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D0E', paddingBottom: 80 }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #2A2F33' }}>
        <h1
          className="text-xl font-bold"
          style={{ color: '#C8FF3A', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
        >
          CUSTOMER PREVIEW
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
          Live preview of what your customers see
        </p>
      </div>

      {/* Phone mockup + link */}
      <div className="flex flex-col items-center py-10 px-6 gap-4">
        {/* Phone frame */}
        <div
          style={{
            position: 'relative',
            width: 393,
            background: '#15181A',
            border: '8px solid #2A2F33',
            borderRadius: 44,
            boxShadow: '0 0 0 2px #0B0D0E, 8px 8px 0 #0B0D0E',
            overflow: 'hidden',
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 28,
              background: '#2A2F33',
              borderRadius: '0 0 16px 16px',
              zIndex: 10,
            }}
          />
          {/* iframe */}
          <iframe
            src="/home?preview=customer"
            style={{
              width: 375,
              height: 812,
              border: 'none',
              display: 'block',
            }}
            title="Customer portal preview"
          />
        </div>

        {/* Open full screen link */}
        <a
          href="/home?preview=customer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium"
          style={{ color: '#C8FF3A', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}
        >
          Open full screen ↗
        </a>
      </div>
    </div>
  )
}
