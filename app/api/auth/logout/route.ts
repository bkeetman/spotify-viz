import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('spotify_access_token')
  res.cookies.delete('spotify_refresh_token')
  res.cookies.delete('spotify_token_expires_at')
  return res
}
