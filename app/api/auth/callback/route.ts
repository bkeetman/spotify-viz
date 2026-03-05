import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/spotify-auth'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const cookieStore = await cookies()
  const savedState = cookieStore.get('spotify_auth_state')?.value

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    const res = NextResponse.redirect(new URL('/tv', appUrl))
    const expiresAt = Date.now() + tokens.expires_in * 1000

    res.cookies.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      maxAge: tokens.expires_in,
      path: '/',
    })
    res.cookies.set('spotify_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    res.cookies.set('spotify_token_expires_at', String(expiresAt), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    res.cookies.delete('spotify_auth_state')

    return res
  } catch {
    return NextResponse.redirect(new URL('/?error=token_failed', req.url))
  }
}
