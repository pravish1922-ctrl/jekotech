import { NextRequest, NextResponse } from 'next/server'

// POST /api/bookings — create booking (Airtable + Supabase mirror + WhatsApp + Claude summary)
export async function POST(_request: NextRequest) {
  // TODO: validate body, write to Airtable, mirror to Supabase, trigger WhatsApp + Claude
  return NextResponse.json({ message: 'not implemented' }, { status: 501 })
}

// PATCH /api/bookings — update status, assignedMechanicId, or finalCostMur
export async function PATCH(_request: NextRequest) {
  // TODO: update booking record
  return NextResponse.json({ message: 'not implemented' }, { status: 501 })
}

// GET /api/bookings?id=... — fetch single booking
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 })
  }

  // TODO: fetch from Supabase
  return NextResponse.json({ message: 'not implemented' }, { status: 501 })
}
