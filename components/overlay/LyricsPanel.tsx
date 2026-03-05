'use client'

import { useEffect, useRef } from 'react'
import type { LrcLine } from '@/lib/lrclib'
import type { Palette } from '@/hooks/usePalette'

interface LyricsPanelProps {
  lines: LrcLine[] | null
  plain: string | null
  activeIndex: number
  palette: Palette
}

export function LyricsPanel({ lines, plain, activeIndex, palette }: LyricsPanelProps) {
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex])

  if (lines && lines.length > 0) {
    return (
      <div className="flex flex-col gap-3 overflow-hidden max-h-[40vh] text-right">
        {lines.map((line, i) => {
          const isActive = i === activeIndex
          const isPast = i < activeIndex
          return (
            <div
              key={i}
              ref={isActive ? activeRef : null}
              style={{
                color: isActive ? palette.lightVibrant : 'white',
                opacity: isActive ? 1 : isPast ? 0.25 : 0.45,
                fontSize: isActive ? '1.5rem' : '1rem',
                fontWeight: isActive ? 700 : 400,
                transition: 'all 0.4s ease',
                lineHeight: 1.3,
              }}
            >
              {line.text}
            </div>
          )
        })}
      </div>
    )
  }

  if (plain) {
    return (
      <div
        className="text-sm text-white/40 leading-relaxed max-h-[40vh] overflow-hidden text-right"
        style={{ maskImage: 'linear-gradient(to bottom, white 60%, transparent)' }}
      >
        {plain}
      </div>
    )
  }

  return null
}
