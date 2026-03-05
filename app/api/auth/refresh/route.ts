import { NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/spotify-auth'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'no_refresh_token' }, { status: 401 })
  }

  try {
    const tokens = await refreshAccessToken(refreshToken)
    const expiresAt = Date.now() + tokens.expires_in * 1000
    const res = NextResponse.json({ ok: true })

    res.cookies.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      maxAge: tokens.expires_in,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    res.cookies.set('spotify_token_expires_at', String(expiresAt), {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'refresh_failed' }, { status: 401 })
  }
}
