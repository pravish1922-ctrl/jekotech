import type { Handler, HandlerEvent } from '@netlify/functions'

// GET /api/qb/vehicle?registration=XX00XXX
// Returns { vehicle: Vehicle, history: ServiceRecord[] } | { found: false }
//
// POST /api/qb/customer — creates customer + vehicle in QBO
// POST /api/qb/invoice  — generates invoice from booking
// POST /api/qb/sync     — nightly reconciliation (also triggered by cron)
export const handler: Handler = async (event: HandlerEvent) => {
  // TODO: implement QuickBooks OAuth flow (store realm + token in Supabase)
  // and customer/vehicle lookup by registration custom field

  return {
    statusCode: 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not implemented' }),
  }
}
