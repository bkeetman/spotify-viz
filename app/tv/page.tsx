'use client'

import { useEffect, useState } from 'react'
import { useNowPlaying } from '@/hooks/useNowPlaying'
import { usePalette } from '@/hooks/usePalette'
import { useLyrics } from '@/hooks/useLyrics'
import { VisualizerScene } from '@/components/visualizer/VisualizerScene'
import { AlbumArt } from '@/components/overlay/AlbumArt'
import { TrackInfo } from '@/components/overlay/TrackInfo'
import { ProgressBar } from '@/components/overlay/ProgressBar'
import { LyricsPanel } from '@/components/overlay/LyricsPanel'

export default function TVPage() {
  const { track, audioFeatures, isAuthenticated } = useNowPlaying(3000)
  const palette = usePalette(track?.albumArtUrl ?? null)
  const { lines, plain, activeIndex } = useLyrics(
    track?.artistName ?? null,
    track?.trackName ?? null,
    track?.progressMs ?? 0
  )

  // Hide cursor on inactivity
  const [showCursor, setShowCursor] = useState(false)
  useEffect(() => {
    let timer: NodeJS.Timeout
    const show = () => {
      setShowCursor(true)
      clearTimeout(timer)
      timer = setTimeout(() => setShowCursor(false), 3000)
    }
    window.addEventListener('mousemove', show)
    return () => {
      window.removeEventListener('mousemove', show)
      clearTimeout(timer)
    }
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Spotify sessie verlopen</p>
          <a href="/api/auth/login" className="underline opacity-60">Opnieuw verbinden</a>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black"
      style={{ cursor: showCursor ? 'default' : 'none' }}
    >
      {/* Background visualizer */}
      <VisualizerScene
        palette={palette}
        audioFeatures={audioFeatures}
        albumArtUrl={track?.albumArtUrl ?? null}
        trackId={track?.trackId ?? null}
      />

      {/* Dark vignette behind text — ensures legibility against any shader color */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
        }}
      />

      {/* Overlay */}
      <div className="relative z-20 flex h-full p-10 lg:p-16 gap-12">
        {/* Left column: album art + track info + progress */}
        <div className="flex flex-col justify-end gap-6 w-64 lg:w-80 shrink-0">
          <AlbumArt url={track?.albumArtUrl ?? null} alt={track?.albumName ?? ''} />
          <TrackInfo track={track} />
          {track && (
            <ProgressBar
              progressMs={track.progressMs}
              durationMs={track.durationMs}
              isPlaying={track.isPlaying}
              palette={palette}
            />
          )}
        </div>

        {/* Right column: lyrics */}
        <div className="flex-1 flex items-end justify-end pb-4">
          <div className="w-full max-w-lg">
            <LyricsPanel
              lines={lines}
              plain={plain}
              activeIndex={activeIndex}
              palette={palette}
            />
          </div>
        </div>
      </div>

      {/* Nothing playing state */}
      {!track?.isPlaying && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <p className="text-white/20 text-2xl tracking-widest uppercase">
            Niets aan het spelen
          </p>
        </div>
      )}
    </div>
  )
}
