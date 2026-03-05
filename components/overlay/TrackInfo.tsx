'use client'

import { useState, useEffect } from 'react'
import type { NowPlayingData } from '@/lib/now-playing'
import type { Palette } from '@/hooks/usePalette'

interface TrackInfoProps {
  track: NowPlayingData | null
  palette: Palette
}

export function TrackInfo({ track, palette }: TrackInfoProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!track) return
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [track?.trackId])

  if (!track) return null

  return (
    <div
      className="flex flex-col gap-1"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      <p
        className="text-xs font-medium tracking-[0.2em] uppercase"
        style={{ color: palette.lightVibrant, opacity: 0.7 }}
      >
        {track.albumName}
      </p>
      <h1
        className="text-4xl lg:text-6xl font-bold text-white leading-tight"
      >
        {track.trackName}
      </h1>
      <p
        className="text-xl lg:text-2xl font-light"
        style={{ color: palette.lightVibrant }}
      >
        {track.artistName}
      </p>
    </div>
  )
}
