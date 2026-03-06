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
  const [connected, setConnected] = useState(false)
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
            setConnected(true)
          } else if (s === SESSION_ENDED) {
            sessionRef.current = null
            setConnected(false)
          }
        }
      )
      setCastReady(true)
    }
  }, [])

  function send(type: string) {
    sessionRef.current?.sendMessage(CAST_NS, { type })
  }

  function handleCast() {
    if (!castReady) return
    ;(window as any).cast.framework.CastContext.getInstance().requestSession()
  }

  function handleToggleLock() {
    const next = !locked
    setLocked(next)
    send(next ? 'lock' : 'unlock')
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
        {/* Status bar area */}
        <div className="flex items-center justify-between px-5 pt-12 pb-2">
          <h1 className="text-xs font-medium tracking-[0.25em] uppercase text-white/30">
            Spotify Viz Remote
          </h1>
          <div className="flex items-center gap-3">
            {connected && (
              <span className="text-xs tracking-widest uppercase text-emerald-400">
                Verbonden
              </span>
            )}
            <button
              onClick={handleCast}
              disabled={!castReady && !!CAST_APP_ID}
              aria-label="Cast naar TV"
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors active:scale-90"
              style={{
                background: connected ? 'rgba(29,185,84,0.15)' : 'rgba(255,255,255,0.06)',
                border: connected ? '1px solid rgba(29,185,84,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: connected ? '#1DB954' : 'rgba(255,255,255,0.5)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2C12 15.05 7.06 10 1 10zm20-6H3C1.9 4 1 4.9 1 6v3h2V6h18v12h-6v2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
              </svg>
            </button>
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
                <p
                  className="text-2xl font-bold text-white leading-tight"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
                >
                  {track.trackName}
                </p>
                <p className="text-white/50 mt-2 text-base">{track.artistName}</p>
                <p className="text-white/25 text-xs mt-1 tracking-wide">{track.albumName}</p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-white/20 text-lg">Niets aan het spelen</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 pb-14 flex flex-col gap-3">
          {connected ? (
            <>
              <div className="flex gap-3">
                <button
                  onClick={handleToggleLock}
                  className="flex-1 py-5 rounded-2xl font-medium text-sm tracking-widest uppercase transition-all active:scale-95"
                  style={{
                    background: locked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                    border: locked
                      ? '1px solid rgba(255,255,255,0.18)'
                      : '1px solid rgba(255,255,255,0.07)',
                    color: locked ? 'white' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {locked ? '■  Vergrendeld' : '▶  Vrij'}
                </button>
                <button
                  onClick={() => send('skip')}
                  disabled={locked}
                  className="flex-1 py-5 rounded-2xl font-medium text-sm tracking-widest uppercase transition-all active:scale-95 disabled:opacity-25"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  Volgende →
                </button>
              </div>
              <p className="text-center text-white/20 text-xs tracking-wide mt-1">
                Dubbeltik op de TV om ook te vergrendelen
              </p>
            </>
          ) : (
            <div
              className="rounded-2xl p-5 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {!CAST_APP_ID ? (
                <p className="text-white/30 text-sm leading-relaxed">
                  Stel <code className="text-white/50">NEXT_PUBLIC_CAST_APP_ID</code> in om te verbinden met Chromecast
                </p>
              ) : (
                <p className="text-white/30 text-sm leading-relaxed">
                  Tik op het Cast-icoon rechtsboven om de TV te verbinden
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
