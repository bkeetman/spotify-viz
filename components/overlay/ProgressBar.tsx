'use client'

import { useEffect, useRef, useState } from 'react'
import type { Palette } from '@/hooks/usePalette'

interface ProgressBarProps {
  progressMs: number
  durationMs: number
  isPlaying: boolean
  palette: Palette
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function ProgressBar({ progressMs, durationMs, isPlaying, palette }: ProgressBarProps) {
  const [localProgress, setLocalProgress] = useState(progressMs)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sync with server poll and interpolate between polls
  useEffect(() => {
    setLocalProgress(progressMs)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!isPlaying) return

    intervalRef.current = setInterval(() => {
      setLocalProgress(p => Math.min(p + 500, durationMs))
    }, 500)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [progressMs, isPlaying, durationMs])

  const pct = durationMs > 0 ? (localProgress / durationMs) * 100 : 0

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative h-1 w-full rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: palette.vibrant,
            transition: 'width 0.5s linear',
          }}
        />
      </div>
      <div className="flex justify-between text-xs opacity-40 text-white">
        <span>{formatTime(localProgress)}</span>
        <span>{formatTime(durationMs)}</span>
      </div>
    </div>
  )
}
