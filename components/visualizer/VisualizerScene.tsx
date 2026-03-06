'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import type { Palette } from '@/hooks/usePalette'
import type { AudioFeatures } from '@/hooks/useNowPlaying'

import auroraSrc from './shaders/aurora'
import pulseSrc from './shaders/pulse'
import nebulaSrc from './shaders/nebula'

const Scene = dynamic(
  () => import('./Scene').then(m => m.Scene),
  { ssr: false }
)

const SHADERS = [auroraSrc, pulseSrc, nebulaSrc]
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
  const [shaderIndex, setShaderIndex] = useState(0)

  // Auto-rotate shaders on timer
  useEffect(() => {
    const id = setInterval(() => {
      setShaderIndex(i => (i + 1) % SHADERS.length)
    }, ROTATION_MS)
    return () => clearInterval(id)
  }, [])

  // Rotate on track change
  useEffect(() => {
    if (trackId) {
      setShaderIndex(i => (i + 1) % SHADERS.length)
    }
  }, [trackId])

  return (
    <Scene
      key={shaderIndex}
      palette={palette}
      audioFeatures={audioFeatures}
      albumArtUrl={albumArtUrl}
      shaderSrc={SHADERS[shaderIndex]}
    />
  )
}
