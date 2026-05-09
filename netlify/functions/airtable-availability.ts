import type { Handler, HandlerEvent } from '@netlify/functions'

// GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns AvailabilityDay[] from the Airtable Bookings table.
// Max 4 bays per day — Airtable is the slot source of truth.
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const from = event.queryStringParameters?.from
  const to   = event.queryStringParameters?.to

  if (!from || !to) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'from and to query params required (YYYY-MM-DD)' }),
    }
  }

  // TODO: implement Airtable query
  // const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  // const base = airtable.base(process.env.AIRTABLE_BASE_ID!)
  // const records = await base('Bookings').select({ filterByFormula: ... }).all()

  return {
    statusCode: 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not implemented' }),
  }
}
