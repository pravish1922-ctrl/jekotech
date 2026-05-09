import { NextRequest, NextResponse } from 'next/server'

// POST /api/claude/summarize
// body: { booking, vehicleHistory }
// → { customerWhatsApp: string, adminWhatsApp: string, internalNotes: string }
export async function POST(_request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 },
    )
  }

  // TODO: use Anthropic SDK with claude-sonnet-4-6
  // import Anthropic from '@anthropic-ai/sdk'
  // const client = new Anthropic({ apiKey })
  // const message = await client.messages.create({ model: 'claude-sonnet-4-6', ... })
  return NextResponse.json({ message: 'not implemented' }, { status: 501 })
}
