import { NextRequest, NextResponse } from 'next/server'
import { parseLrc, type LrcLine } from '@/lib/lrclib'

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get('artist')
  const title = req.nextUrl.searchParams.get('title')

  if (!artist || !title) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`

  try {
    const res = await fetch(url, {
      headers: { 'Lrclib-Client': 'spotify-visualizer/1.0' },
      next: { revalidate: 3600 },
    })

    if (res.status === 404) {
      return NextResponse.json({ lines: null, plain: null })
    }

    if (!res.ok) {
      return NextResponse.json({ lines: null, plain: null })
    }

    const data = await res.json()
    let lines: LrcLine[] | null = null

    if (data.syncedLyrics) {
      lines = parseLrc(data.syncedLyrics)
    }

    return NextResponse.json({
      lines,
      plain: data.plainLyrics ?? null,
    })
  } catch {
    return NextResponse.json({ lines: null, plain: null })
  }
}
