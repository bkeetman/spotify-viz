'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useRef, useCallback } from 'react'
import type { Palette } from '@/hooks/usePalette'
import type { AudioFeatures } from '@/hooks/useNowPlaying'
import { VISUALIZATIONS } from './registry'

const Scene = dynamic(
  () => import('./Scene').then(m => m.Scene),
  { ssr: false }
)

const ROTATION_MS = 3.5 * 60 * 1000

interface VisualizerSceneProps {
  palette: Palette
  audioFeatures: AudioFeatures | null
  albumArtUrl: string | null
  trackId: string | null
}

export function VisualizerScene({
  palette,
  audioFeatures,
  albumArtUrl,
  trackId,
}: VisualizerSceneProps) {
  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [toast, setToast] = useState<{ msg: string; locked: boolean } | null>(null)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((msg: string, isLocked: boolean) => {
    setToast({ msg, locked: isLocked })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2000)
  }, [])

  const next = useCallback(() => {
    setIndex(i => (i + 1) % VISUALIZATIONS.length)
  }, [])

  const toggleLock = useCallback(() => {
    setLocked(prev => {
      const newLocked = !prev
      showToast(newLocked ? VISUALIZATIONS[index].name : 'Vrij', newLocked)
      return newLocked
    })
  }, [showToast, index])

  // Auto-rotation
  useEffect(() => {
    if (locked) return
    const id = setInterval(next, ROTATION_MS)
    return () => clearInterval(id)
  }, [locked, next])

  // Rotate on track change
  useEffect(() => {
    if (!trackId || locked) return
    next()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId])

  // Keyboard: L = lock, ArrowRight/Space = skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        toggleLock()
      } else if ((e.key === 'ArrowRight' || e.key === ' ') && !locked) {
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [locked, next, toggleLock])

  // Double-click anywhere = lock/unlock
  const handleClick = useCallback(() => {
    clickCountRef.current += 1
    if (clickCountRef.current >= 2) {
      toggleLock()
      clickCountRef.current = 0
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
      return
    }
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0
    }, 300)
  }, [toggleLock])

  const viz = VISUALIZATIONS[index]

  return (
    <div className="fixed inset-0" onClick={handleClick}>
      <Scene
        key={index}
        palette={palette}
        audioFeatures={audioFeatures}
        albumArtUrl={albumArtUrl}
        shaderSrc={viz.shader}
      />

      {/* Toast notification — appears briefly, then fades */}
      <div
        className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          opacity: toast ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '14px',
            padding: '12px 24px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ opacity: 0.5 }}>{toast?.locked ? '■' : '▶'}</span>
          {toast?.msg ?? ''}
        </div>
      </div>
    </div>
  )
}
