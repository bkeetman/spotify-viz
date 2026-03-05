import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseNowPlaying } from '@/lib/now-playing'

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('spotify_access_token')?.value

  if (!accessToken) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  })

  if (res.status === 204) {
    return NextResponse.json({ isPlaying: false, trackId: null })
  }

  if (res.status === 401) {
    return NextResponse.json({ error: 'token_expired' }, { status: 401 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'spotify_error' }, { status: 502 })
  }

  const data = await res.json()

  // Fetch audio features for BPM/energy
  let audioFeatures = null
  if (data?.item?.id) {
    const featRes = await fetch(
      `https://api.spotify.com/v1/audio-features/${data.item.id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (featRes.ok) audioFeatures = await featRes.json()
  }

  return NextResponse.json({
    track: parseNowPlaying(data),
    audioFeatures: audioFeatures
      ? {
          tempo: audioFeatures.tempo,
          energy: audioFeatures.energy,
          danceability: audioFeatures.danceability,
          valence: audioFeatures.valence,
        }
      : null,
  })
}
