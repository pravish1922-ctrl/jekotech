import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function roleHome(role: string | null): string {
  switch (role) {
    case 'owner':
    case 'delegate':
    case 'staff':    return '/admin/bookings'
    case 'mechanic': return '/mechanic/jobs'
    default:         return '/home'
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  let destination = '/home'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.user) {
      const user = data.user
      const name =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        ''

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      )

      // Phone-based walk-in merge: if a walk-in client record (email=null) shares
      // this phone number, transfer their bookings/vehicles to the real auth ID
      const phone =
        (user.user_metadata?.phone as string | undefined) ??
        (user.phone ?? null)

      if (phone) {
        const { data: walkin } = await supabaseAdmin
          .from('clients')
          .select('id')
          .eq('phone', phone)
          .is('email', null)
          .maybeSingle()

        if (walkin && walkin.id !== user.id) {
          await supabaseAdmin
            .from('bookings')
            .update({ client_id: user.id })
            .eq('client_id', walkin.id)

          await supabaseAdmin
            .from('vehicles')
            .update({ owner_client_id: user.id })
            .eq('owner_client_id', walkin.id)

          await supabaseAdmin
            .from('clients')
            .delete()
            .eq('id', walkin.id)
        }
      }

      // Create clients row if it doesn't exist (idempotent for OAuth sign-ins)
      await supabaseAdmin.from('clients').upsert(
        {
          id:              user.id,
          name,
          email:           user.email ?? '',
          role:            'customer',
          whatsapp_opt_in: false,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      // Look up the user's actual role (may differ from 'customer' for existing users)
      const { data: clientRow } = await supabaseAdmin
        .from('clients')
        .select('role')
        .eq('id', user.id)
        .single()

      destination = roleHome(clientRow?.role ?? null)
    }
  }

  return NextResponse.redirect(`${origin}${destination}`)
}
