import type { Handler, HandlerEvent } from '@netlify/functions'

// Internal utility — mirrors Airtable bookings into Supabase for realtime
// and admin dashboard queries. Called as a side-effect after create/update,
// and on nightly QB reconciliation cron.
export const handler: Handler = async (_event: HandlerEvent) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Supabase env vars not configured' }),
    }
  }

  // TODO: implement sync
  // import { createClient } from '@supabase/supabase-js'
  // const supabase = createClient(supabaseUrl, serviceKey)
  // const { error } = await supabase.from('bookings').upsert(...)

  return {
    statusCode: 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not implemented' }),
  }
}
