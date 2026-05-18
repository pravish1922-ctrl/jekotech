import { NextResponse } from 'next/server'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  `${siteUrl}/api/auth/callback/google`,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account',
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}