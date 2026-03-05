import { NextRequest, NextResponse } from 'next/server'
import { Vibrant } from 'node-vibrant/node'

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get('url')
  if (!imageUrl) {
    return NextResponse.json({ error: 'missing url' }, { status: 400 })
  }

  try {
    const palette = await Vibrant.from(imageUrl).getPalette()
    return NextResponse.json({
      vibrant: palette.Vibrant?.hex ?? '#ffffff',
      muted: palette.Muted?.hex ?? '#888888',
      darkVibrant: palette.DarkVibrant?.hex ?? '#000000',
      darkMuted: palette.DarkMuted?.hex ?? '#111111',
      lightVibrant: palette.LightVibrant?.hex ?? '#eeeeee',
    })
  } catch {
    return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
  }
}
