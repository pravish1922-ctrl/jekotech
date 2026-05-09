import { NextRequest, NextResponse } from 'next/server'

// GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns AvailabilityDay[] from Airtable Bookings table.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json(
      { error: 'from and to query params required (YYYY-MM-DD)' },
      { status: 400 },
    )
  }

  // TODO: query Airtable and return AvailabilityDay[]
  return NextResponse.json({ message: 'not implemented' }, { status: 501 })
}
