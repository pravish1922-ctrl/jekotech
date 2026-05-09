import { NextRequest, NextResponse } from 'next/server'

// GET /api/qb/vehicle?registration=XX00XXX
// Returns { vehicle: Vehicle, history: ServiceRecord[] } | { found: false }
export async function GET(request: NextRequest) {
  const registration = request.nextUrl.searchParams.get('registration')
  if (!registration) {
    return NextResponse.json(
      { error: 'registration query param required' },
      { status: 400 },
    )
  }

  // TODO: QuickBooks Online lookup by registration custom field
  return NextResponse.json({ message: 'not implemented' }, { status: 501 })
}

// POST /api/qb/vehicle — create customer + vehicle in QBO
export async function POST(_request: NextRequest) {
  // TODO: create QB customer and vehicle reference
  return NextResponse.json({ message: 'not implemented' }, { status: 501 })
}
