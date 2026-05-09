import type { Handler, HandlerEvent } from '@netlify/functions'

// POST /api/whatsapp/send
// body: { to: string (E.164), template: string, vars: Record<string, string> }
// → { messageId: string, status: string }
//
// POST /api/whatsapp/webhook
// Meta delivery + read receipts → updates message status in Supabase
export const handler: Handler = async (event: HandlerEvent) => {
  // Webhook verification (GET with hub.challenge)
  if (event.httpMethod === 'GET') {
    const mode      = event.queryStringParameters?.['hub.mode']
    const challenge = event.queryStringParameters?.['hub.challenge']
    const verify    = event.queryStringParameters?.['hub.verify_token']

    if (mode === 'subscribe' && verify === process.env.WHATSAPP_VERIFY_TOKEN) {
      return { statusCode: 200, body: challenge ?? '' }
    }

    return { statusCode: 403, body: 'Forbidden' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // TODO: send via WhatsApp Business Cloud API
  // POST https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages

  return {
    statusCode: 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not implemented' }),
  }
}
