import type { Handler, HandlerEvent } from '@netlify/functions'

// POST /api/claude/summarize-booking
// body: { booking, vehicleHistory }
// → { customerWhatsApp: string, adminWhatsApp: string, internalNotes: string }
//
// POST /api/claude/triage-message
// body: { incomingMessage, recentHistory }
// → { suggestedReply: string, urgency: 'low'|'med'|'high', tags: string[] }
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
    }
  }

  // TODO: implement with Anthropic SDK
  // import Anthropic from '@anthropic-ai/sdk'
  // const client = new Anthropic({ apiKey })
  // const response = await client.messages.create({
  //   model: 'claude-sonnet-4-6',
  //   max_tokens: 1024,
  //   messages: [{ role: 'user', content: prompt }],
  // })

  return {
    statusCode: 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not implemented' }),
  }
}
