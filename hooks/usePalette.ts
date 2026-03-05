'use client'

import { useState, useEffect } from 'react'

export interface Palette {
  vibrant: string
  muted: string
  darkVibrant: string
  darkMuted: string
  lightVibrant: string
}

const DEFAULT_PALETTE: Palette = {
  vibrant: '#7c3aed',
  muted: '#4c1d95',
  darkVibrant: '#1e0045',
  darkMuted: '#0f0020',
  lightVibrant: '#c4b5fd',
}

export function usePalette(albumArtUrl: string | null): Palette {
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE)

  useEffect(() => {
    if (!albumArtUrl) return

    fetch(`/api/palette?url=${encodeURIComponent(albumArtUrl)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) setPalette(data)
      })
      .catch(() => {})
  }, [albumArtUrl])

  return palette
}
