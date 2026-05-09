import type { Handler, HandlerEvent } from '@netlify/functions'

// POST /api/bookings
// Creates Airtable record (locks slot), mirrors to Supabase, triggers WhatsApp + Claude summary.
//
// PATCH /api/bookings/:id
// Updates status, assignedMechanicId, or finalCostGbp.
export const handler: Handler = async (event: HandlerEvent) => {
  if (!['POST', 'PATCH'].includes(event.httpMethod)) {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body required' }),
    }
  }

  // TODO: parse body, validate with Zod, write to Airtable + Supabase,
  // call whatsapp-send and claude-summarize functions

  return {
    statusCode: 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not implemented' }),
  }
}
