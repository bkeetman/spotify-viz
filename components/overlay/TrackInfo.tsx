'use client'

import { useState, useEffect } from 'react'
import type { NowPlayingData } from '@/lib/now-playing'

interface TrackInfoProps {
  track: NowPlayingData | null
}

export function TrackInfo({ track }: TrackInfoProps) {
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
        className="text-xs font-medium tracking-[0.2em] uppercase text-white/60"
        style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
      >
        {track.albumName}
      </p>
      <h1
        className="text-4xl lg:text-6xl font-bold text-white leading-tight"
        style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
      >
        {track.trackName}
      </h1>
      <p
        className="text-xl lg:text-2xl font-light text-white/80"
        style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
      >
        {track.artistName}
      </p>
    </div>
  )
}
