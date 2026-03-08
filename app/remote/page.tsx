'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import Image from 'next/image'
import { useNowPlaying } from '@/hooks/useNowPlaying'

const CAST_APP_ID = process.env.NEXT_PUBLIC_CAST_APP_ID ?? ''
const CAST_NS = 'urn:x-cast:com.spotifyviz.control'

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void
  }
}

export default function RemotePage() {
  const { track, isAuthenticated } = useNowPlaying(3000)
  const [castReady, setCastReady] = useState(false)
  const [castConnected, setCastConnected] = useState(false)
  const [locked, setLocked] = useState(false)
  const sessionRef = useRef<any>(null)

  useEffect(() => {
    if (!CAST_APP_ID) return
    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (!isAvailable) return
      const w = window as any
      const ctx = w.cast.framework.CastContext.getInstance()
      ctx.setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: w.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      })
      ctx.addEventListener(
        w.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (e: any) => {
          const { SESSION_STARTED, SESSION_RESUMED, SESSION_ENDED } =
            w.cast.framework.SessionState
          const s = e.sessionState
          if (s === SESSION_STARTED || s === SESSION_RESUMED) {
            sessionRef.current = ctx.getCurrentSession()
            setCastConnected(true)
          } else if (s === SESSION_ENDED) {
            sessionRef.current = null
            setCastConnected(false)
          }
        }
      )
      setCastReady(true)
    }
  }, [])

  async function sendCommand(action: string) {
    // Send via Cast message bus if connected
    sessionRef.current?.sendMessage(CAST_NS, { type: action })
    // Always also send via API — works for tab-cast, MacBook cast, any scenario
    await fetch('/api/viz-control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
  }

  function handleCast() {
    if (!castReady) return
    ;(window as any).cast.framework.CastContext.getInstance().requestSession()
  }

  async function handleToggleLock() {
    const next = !locked
    setLocked(next)
    await sendCommand(next ? 'lock' : 'unlock')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center px-8">
          <p className="text-white/60 mb-6">Verbind eerst Spotify</p>
          <a
            href="/api/auth/login"
            className="px-6 py-3 rounded-full text-black font-semibold text-sm"
            style={{ backgroundColor: '#1DB954' }}
          >
            Verbind met Spotify
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      {CAST_APP_ID && (
        <Script
          src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
          strategy="afterInteractive"
        />
      )}

      <div className="min-h-screen bg-neutral-950 flex flex-col select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-2">
          <h1 className="text-xs font-medium tracking-[0.25em] uppercase text-white/30">
            Remote
          </h1>
          <div className="flex items-center gap-3">
            {castConnected && (
              <span className="text-xs tracking-widest uppercase text-emerald-400">Cast actief</span>
            )}
            {/* Cast button: launches /tv on Chromecast */}
            {castReady && (
              <button
                onClick={handleCast}
                aria-label="Start Visualizer op Chromecast"
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90"
                style={{
                  background: castConnected ? 'rgba(29,185,84,0.15)' : 'rgba(255,255,255,0.06)',
                  border: castConnected
                    ? '1px solid rgba(29,185,84,0.3)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: castConnected ? '#1DB954' : 'rgba(255,255,255,0.5)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2C12 15.05 7.06 10 1 10zm20-6H3C1.9 4 1 4.9 1 6v3h2V6h18v12h-6v2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Track info */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-7">
          {track ? (
            <>
              {track.albumArtUrl && (
                <div
                  className="rounded-3xl overflow-hidden relative shadow-2xl"
                  style={{ width: 220, height: 220 }}
                >
                  <Image
                    src={track.albumArtUrl}
                    alt={track.albumName}
                    fill
                    className="object-cover"
                    sizes="220px"
                  />
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold text-white leading-tight">
                  {track.trackName}
                </p>
                <p className="text-white/50 mt-2 text-base">{track.artistName}</p>
                <p className="text-white/25 text-xs mt-1 tracking-wide">{track.albumName}</p>
              </div>
            </>
          ) : (
            <p className="text-white/20 text-lg">Niets aan het spelen</p>
          )}
        </div>

        {/* Controls — always visible, work via API regardless of Cast */}
        <div className="px-6 pb-14 flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={handleToggleLock}
              className="flex-1 py-5 rounded-2xl font-medium text-sm tracking-widest uppercase transition-all active:scale-95"
              style={{
                background: locked ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
                border: locked
                  ? '1px solid rgba(255,255,255,0.18)'
                  : '1px solid rgba(255,255,255,0.07)',
                color: locked ? 'white' : 'rgba(255,255,255,0.45)',
              }}
            >
              {locked ? '■  Vergrendeld' : '▶  Vrij'}
            </button>
            <button
              onClick={() => sendCommand('skip')}
              disabled={locked}
              className="flex-1 py-5 rounded-2xl font-medium text-sm tracking-widest uppercase transition-all active:scale-95 disabled:opacity-25"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              Volgende →
            </button>
          </div>

          {/* Open TV pagina knop — voor als je Cast handmatig doet via browser */}
          <a
            href="/tv"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center py-3 rounded-xl text-xs tracking-widest uppercase transition-all active:scale-95"
            style={{
              color: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            Open TV Pagina ↗
          </a>
        </div>
      </div>
    </>
  )
}
