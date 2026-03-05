'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { NowPlayingData } from '@/lib/now-playing'

export interface AudioFeatures {
  tempo: number
  energy: number
  danceability: number
  valence: number
}

export interface NowPlayingState {
  track: NowPlayingData | null
  audioFeatures: AudioFeatures | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useNowPlaying(intervalMs = 3000): NowPlayingState {
  const [state, setState] = useState<NowPlayingState>({
    track: null,
    audioFeatures: null,
    isLoading: true,
    isAuthenticated: true,
  })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch('/api/now-playing')

      if (res.status === 401) {
        // Try to refresh token
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' })
        if (!refreshRes.ok) {
          setState(s => ({ ...s, isAuthenticated: false, isLoading: false }))
          return
        }
        // Retry once after refresh
        const retryRes = await fetch('/api/now-playing')
        if (!retryRes.ok) return
        const data = await retryRes.json()
        setState(s => ({ ...s, ...data, isLoading: false, isAuthenticated: true }))
        return
      }

      const data = await res.json()
      setState(s => ({ ...s, ...data, isLoading: false, isAuthenticated: true }))
    } catch {
      setState(s => ({ ...s, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    fetchNowPlaying()
    intervalRef.current = setInterval(fetchNowPlaying, intervalMs)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchNowPlaying, intervalMs])

  return state
}
