import { NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/spotify-auth'
import { cookies } from 'next/headers'

export async function GET() {
  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('spotify_auth_state', state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
  return NextResponse.redirect(buildAuthUrl(state))
}
