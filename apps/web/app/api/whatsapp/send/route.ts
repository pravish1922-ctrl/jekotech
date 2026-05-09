import { NextRequest, NextResponse } from 'next/server'

// POST /api/whatsapp/send
// body: { to: string (E.164), template: string, vars: Record<string, string> }
export async function POST(_request: NextRequest) {
  const token   = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneId) {
    return NextResponse.json(
      { error: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured' },
      { status: 500 },
    )
  }

  // TODO: POST to https://graph.facebook.com/v19.0/{phoneId}/messages
  return NextResponse.json({ message: 'not implemented' }, { status: 501 })
}

// GET /api/whatsapp/send — Meta webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const mode      = searchParams.get('hub.mode')
  const challenge = searchParams.get('hub.challenge')
  const verify    = searchParams.get('hub.verify_token')

  if (mode === 'subscribe' && verify === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}
