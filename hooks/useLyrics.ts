'use client'

import { useState, useEffect } from 'react'
import type { LrcLine } from '@/lib/lrclib'
import { findActiveLine } from '@/lib/lrclib'

export interface LyricsState {
  lines: LrcLine[] | null
  plain: string | null
  activeIndex: number
}

export function useLyrics(
  artist: string | null,
  title: string | null,
  progressMs: number
): LyricsState {
  const [lines, setLines] = useState<LrcLine[] | null>(null)
  const [plain, setPlain] = useState<string | null>(null)

  useEffect(() => {
    if (!artist || !title) return

    setLines(null)
    setPlain(null)

    fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`)
      .then(r => r.json())
      .then(data => {
        setLines(data.lines)
        setPlain(data.plain)
      })
      .catch(() => {})
  }, [artist, title])

  const activeIndex = lines ? findActiveLine(lines, progressMs) : 0

  return { lines, plain, activeIndex }
}
