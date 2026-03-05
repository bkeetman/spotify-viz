# Spotify Visualizer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fullscreen Spotify music visualizer for TV/Chromecast casting, with GPU-accelerated GLSL shaders, album art, synced lyrics, and multi-user Spotify OAuth.

**Architecture:** Next.js 14 App Router with TypeScript. All Spotify OAuth handled server-side via API routes (tokens in httpOnly cookies). Three.js renders a fullscreen fragment shader plane driven by music data (BPM, energy, palette). UI overlay (album art, track info, lyrics) sits above the canvas.

**Tech Stack:** Next.js 14, TypeScript, Three.js, GLSL, node-vibrant, LRCLIB API, Spotify Web API, Tailwind CSS, Vercel

---

## Phase 1: Project Foundation

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.env.local`, `.env.example`

**Step 1: Bootstrap the project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

**Step 2: Install dependencies**

```bash
npm install three node-vibrant
npm install --save-dev @types/three jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom ts-jest
```

**Step 3: Add raw-loader for GLSL files in `next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      type: 'asset/source',
    })
    return config
  },
}

export default nextConfig
```

**Step 4: Add GLSL type declaration `src/types/glsl.d.ts`**

```typescript
declare module '*.glsl' {
  const value: string
  export default value
}
```

**Step 5: Create `.env.example`**

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 6: Create `.env.local` (copy from example, gitignore it)**

```bash
cp .env.example .env.local
```

Verify `.gitignore` already includes `.env.local` (create-next-app adds this).

**Step 7: Set up Jest — create `jest.config.ts`**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

**Step 8: Create `jest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

**Step 9: Add test script to `package.json`**

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

**Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with Three.js and GLSL support"
```

---

### Task 2: Spotify OAuth — server-side API routes

**Files:**
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/callback/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `lib/spotify-auth.ts`
- Create: `lib/spotify-auth.test.ts`

**Step 1: Write failing tests for `lib/spotify-auth.ts`**

Create `lib/spotify-auth.test.ts`:

```typescript
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  SCOPES,
} from './spotify-auth'

describe('buildAuthUrl', () => {
  beforeEach(() => {
    process.env.SPOTIFY_CLIENT_ID = 'test-client-id'
    process.env.SPOTIFY_REDIRECT_URI = 'http://localhost:3000/api/auth/callback'
  })

  it('returns a valid Spotify authorize URL', () => {
    const url = buildAuthUrl('test-state')
    expect(url).toContain('https://accounts.spotify.com/authorize')
    expect(url).toContain('client_id=test-client-id')
    expect(url).toContain('state=test-state')
    expect(url).toContain('response_type=code')
  })

  it('includes required scopes', () => {
    const url = buildAuthUrl('s')
    expect(url).toContain('user-read-currently-playing')
    expect(url).toContain('user-read-playback-state')
  })
})

describe('SCOPES', () => {
  it('includes all needed scopes', () => {
    expect(SCOPES).toContain('user-read-currently-playing')
    expect(SCOPES).toContain('user-read-playback-state')
  })
})
```

**Step 2: Run test to confirm it fails**

```bash
npm test lib/spotify-auth.test.ts
```

Expected: FAIL — module not found

**Step 3: Implement `lib/spotify-auth.ts`**

```typescript
export const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
].join(' ')

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    state,
    scope: SCOPES,
  })
  return `https://accounts.spotify.com/authorize?${params}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body,
  })

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)
  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body,
  })

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  return res.json()
}
```

**Step 4: Run test to confirm it passes**

```bash
npm test lib/spotify-auth.test.ts
```

Expected: PASS

**Step 5: Create `app/api/auth/login/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/spotify-auth'
import { cookies } from 'next/headers'

export async function GET() {
  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('spotify_auth_state', state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: '/',
  })
  return NextResponse.redirect(buildAuthUrl(state))
}
```

**Step 6: Create `app/api/auth/callback/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/spotify-auth'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const cookieStore = await cookies()
  const savedState = cookieStore.get('spotify_auth_state')?.value

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    const res = NextResponse.redirect(new URL('/tv', appUrl))
    const expiresAt = Date.now() + tokens.expires_in * 1000

    res.cookies.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      maxAge: tokens.expires_in,
      path: '/',
    })
    res.cookies.set('spotify_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    res.cookies.set('spotify_token_expires_at', String(expiresAt), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    res.cookies.delete('spotify_auth_state')

    return res
  } catch {
    return NextResponse.redirect(new URL('/?error=token_failed', req.url))
  }
}
```

**Step 7: Create `app/api/auth/logout/route.ts`**

```typescript
import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('spotify_access_token')
  res.cookies.delete('spotify_refresh_token')
  res.cookies.delete('spotify_token_expires_at')
  return res
}
```

**Step 8: Create `app/api/auth/refresh/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/spotify-auth'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'no_refresh_token' }, { status: 401 })
  }

  try {
    const tokens = await refreshAccessToken(refreshToken)
    const expiresAt = Date.now() + tokens.expires_in * 1000
    const res = NextResponse.json({ ok: true })

    res.cookies.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      maxAge: tokens.expires_in,
      path: '/',
    })
    res.cookies.set('spotify_token_expires_at', String(expiresAt), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'refresh_failed' }, { status: 401 })
  }
}
```

**Step 9: Commit**

```bash
git add .
git commit -m "feat: add Spotify OAuth flow with server-side token management"
```

---

### Task 3: Now Playing API route + polling hook

**Files:**
- Create: `app/api/now-playing/route.ts`
- Create: `lib/now-playing.ts`
- Create: `lib/now-playing.test.ts`
- Create: `hooks/useNowPlaying.ts`

**Step 1: Write failing test for `lib/now-playing.ts`**

Create `lib/now-playing.test.ts`:

```typescript
import { parseNowPlaying } from './now-playing'

const mockSpotifyResponse = {
  is_playing: true,
  progress_ms: 45000,
  item: {
    id: 'track-123',
    name: 'Test Track',
    duration_ms: 200000,
    artists: [{ name: 'Test Artist' }],
    album: {
      name: 'Test Album',
      images: [
        { url: 'https://example.com/large.jpg', width: 640, height: 640 },
        { url: 'https://example.com/small.jpg', width: 64, height: 64 },
      ],
    },
  },
}

describe('parseNowPlaying', () => {
  it('extracts track data correctly', () => {
    const result = parseNowPlaying(mockSpotifyResponse)
    expect(result).toEqual({
      isPlaying: true,
      progressMs: 45000,
      durationMs: 200000,
      trackId: 'track-123',
      trackName: 'Test Track',
      artistName: 'Test Artist',
      albumName: 'Test Album',
      albumArtUrl: 'https://example.com/large.jpg',
    })
  })

  it('returns null for null input', () => {
    expect(parseNowPlaying(null)).toBeNull()
  })

  it('picks the largest album art', () => {
    const result = parseNowPlaying(mockSpotifyResponse)
    expect(result?.albumArtUrl).toBe('https://example.com/large.jpg')
  })
})
```

**Step 2: Run test to confirm it fails**

```bash
npm test lib/now-playing.test.ts
```

**Step 3: Implement `lib/now-playing.ts`**

```typescript
export interface NowPlayingData {
  isPlaying: boolean
  progressMs: number
  durationMs: number
  trackId: string
  trackName: string
  artistName: string
  albumName: string
  albumArtUrl: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseNowPlaying(data: any): NowPlayingData | null {
  if (!data?.item) return null

  const images = data.item.album.images as { url: string; width: number }[]
  const largestImage = images.sort((a, b) => b.width - a.width)[0]

  return {
    isPlaying: data.is_playing,
    progressMs: data.progress_ms,
    durationMs: data.item.duration_ms,
    trackId: data.item.id,
    trackName: data.item.name,
    artistName: data.item.artists[0].name,
    albumName: data.item.album.name,
    albumArtUrl: largestImage.url,
  }
}
```

**Step 4: Run test to confirm it passes**

```bash
npm test lib/now-playing.test.ts
```

**Step 5: Create `app/api/now-playing/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseNowPlaying } from '@/lib/now-playing'

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('spotify_access_token')?.value

  if (!accessToken) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  })

  if (res.status === 204) {
    return NextResponse.json({ isPlaying: false, trackId: null })
  }

  if (res.status === 401) {
    return NextResponse.json({ error: 'token_expired' }, { status: 401 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'spotify_error' }, { status: 502 })
  }

  const data = await res.json()

  // Fetch audio features for BPM/energy
  let audioFeatures = null
  if (data?.item?.id) {
    const featRes = await fetch(
      `https://api.spotify.com/v1/audio-features/${data.item.id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (featRes.ok) audioFeatures = await featRes.json()
  }

  return NextResponse.json({
    track: parseNowPlaying(data),
    audioFeatures: audioFeatures
      ? {
          tempo: audioFeatures.tempo,
          energy: audioFeatures.energy,
          danceability: audioFeatures.danceability,
          valence: audioFeatures.valence,
        }
      : null,
  })
}
```

**Step 6: Create `hooks/useNowPlaying.ts`**

```typescript
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
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add now-playing API route and polling hook"
```

---

### Task 4: Palette API route + hook

**Files:**
- Create: `app/api/palette/route.ts`
- Create: `hooks/usePalette.ts`

**Step 1: Create `app/api/palette/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Vibrant from 'node-vibrant'

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get('url')
  if (!imageUrl) {
    return NextResponse.json({ error: 'missing url' }, { status: 400 })
  }

  try {
    const palette = await Vibrant.from(imageUrl).getPalette()
    return NextResponse.json({
      vibrant: palette.Vibrant?.hex ?? '#ffffff',
      muted: palette.Muted?.hex ?? '#888888',
      darkVibrant: palette.DarkVibrant?.hex ?? '#000000',
      darkMuted: palette.DarkMuted?.hex ?? '#111111',
      lightVibrant: palette.LightVibrant?.hex ?? '#eeeeee',
    })
  } catch {
    return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
  }
}
```

**Step 2: Create `hooks/usePalette.ts`**

```typescript
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
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add palette extraction API and hook"
```

---

### Task 5: Lyrics API + sync hook

**Files:**
- Create: `lib/lrclib.ts`
- Create: `lib/lrclib.test.ts`
- Create: `app/api/lyrics/route.ts`
- Create: `hooks/useLyrics.ts`

**Step 1: Write failing tests for `lib/lrclib.ts`**

Create `lib/lrclib.test.ts`:

```typescript
import { parseLrc, findActiveLine } from './lrclib'

const LRC_SAMPLE = `[00:12.34]First line
[00:15.00]Second line
[00:20.50]Third line`

describe('parseLrc', () => {
  it('parses timestamps and text', () => {
    const lines = parseLrc(LRC_SAMPLE)
    expect(lines).toHaveLength(3)
    expect(lines[0]).toEqual({ timeMs: 12340, text: 'First line' })
    expect(lines[1]).toEqual({ timeMs: 15000, text: 'Second line' })
    expect(lines[2]).toEqual({ timeMs: 20500, text: 'Third line' })
  })

  it('returns empty array for empty input', () => {
    expect(parseLrc('')).toEqual([])
  })

  it('skips lines without valid timestamps', () => {
    const result = parseLrc('[ar:Artist]\n[00:10.00]Real line')
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Real line')
  })
})

describe('findActiveLine', () => {
  const lines = [
    { timeMs: 0, text: 'Intro' },
    { timeMs: 10000, text: 'Line one' },
    { timeMs: 20000, text: 'Line two' },
  ]

  it('returns index of current active line', () => {
    expect(findActiveLine(lines, 15000)).toBe(1)
    expect(findActiveLine(lines, 22000)).toBe(2)
  })

  it('returns 0 before first line', () => {
    expect(findActiveLine(lines, 0)).toBe(0)
  })
})
```

**Step 2: Run test to confirm it fails**

```bash
npm test lib/lrclib.test.ts
```

**Step 3: Implement `lib/lrclib.ts`**

```typescript
export interface LrcLine {
  timeMs: number
  text: string
}

export function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = []
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/

  for (const line of lrc.split('\n')) {
    const match = line.match(regex)
    if (!match) continue
    const [, min, sec, cs, text] = match
    const timeMs =
      parseInt(min) * 60000 +
      parseInt(sec) * 1000 +
      (cs.length === 2 ? parseInt(cs) * 10 : parseInt(cs))
    lines.push({ timeMs, text: text.trim() })
  }

  return lines.sort((a, b) => a.timeMs - b.timeMs)
}

export function findActiveLine(lines: LrcLine[], progressMs: number): number {
  let activeIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].timeMs <= progressMs) activeIndex = i
    else break
  }
  return activeIndex
}
```

**Step 4: Run test to confirm it passes**

```bash
npm test lib/lrclib.test.ts
```

**Step 5: Create `app/api/lyrics/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { parseLrc, type LrcLine } from '@/lib/lrclib'

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get('artist')
  const title = req.nextUrl.searchParams.get('title')

  if (!artist || !title) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`

  try {
    const res = await fetch(url, {
      headers: { 'Lrclib-Client': 'spotify-visualizer/1.0' },
      next: { revalidate: 3600 },
    })

    if (res.status === 404) {
      return NextResponse.json({ lines: null, plain: null })
    }

    if (!res.ok) {
      return NextResponse.json({ lines: null, plain: null })
    }

    const data = await res.json()
    let lines: LrcLine[] | null = null

    if (data.syncedLyrics) {
      lines = parseLrc(data.syncedLyrics)
    }

    return NextResponse.json({
      lines,
      plain: data.plainLyrics ?? null,
    })
  } catch {
    return NextResponse.json({ lines: null, plain: null })
  }
}
```

**Step 6: Create `hooks/useLyrics.ts`**

```typescript
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
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add lyrics API with LRC parsing and sync hook"
```

---

## Phase 2: Visual Engine

### Task 6: Three.js scene base

**Files:**
- Create: `components/visualizer/Scene.tsx`
- Create: `components/visualizer/ShaderBackground.tsx`

**Step 1: Create `components/visualizer/Scene.tsx`**

This sets up the Three.js renderer inside a React component using a canvas ref. Uses `dynamic` import to avoid SSR.

```typescript
'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { Palette } from '@/hooks/usePalette'
import type { AudioFeatures } from '@/hooks/useNowPlaying'

interface SceneProps {
  palette: Palette
  audioFeatures: AudioFeatures | null
  albumArtUrl: string | null
  shaderSrc: string
}

export function Scene({ palette, audioFeatures, albumArtUrl, shaderSrc }: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const clockRef = useRef(new THREE.Clock())
  const beatRef = useRef(0)
  const beatTimerRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  // Build scene once
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, preserveDrawingBuffer: true, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: shaderSrc,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_energy: { value: 0.5 },
        u_tempo: { value: 120 },
        u_beat: { value: 0 },
        u_color_a: { value: new THREE.Color(palette.vibrant) },
        u_color_b: { value: new THREE.Color(palette.muted) },
        u_color_c: { value: new THREE.Color(palette.darkVibrant) },
        u_album_tex: { value: null },
      },
    })
    materialRef.current = material

    scene.add(new THREE.Mesh(geometry, material))

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4, 0.4, 0.85
    ))
    composerRef.current = composer

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
      material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const elapsed = clockRef.current.getElapsedTime()
      material.uniforms.u_time.value = elapsed

      // Beat decay
      beatRef.current *= 0.92
      material.uniforms.u_beat.value = beatRef.current

      composer.render()
    }
    animate()

    return () => {
      window.removeEventListener('resize', onResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      renderer.dispose()
    }
  // shaderSrc intentionally not in deps — shader changes handled separately
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update palette uniforms
  useEffect(() => {
    const mat = materialRef.current
    if (!mat) return
    mat.uniforms.u_color_a.value = new THREE.Color(palette.vibrant)
    mat.uniforms.u_color_b.value = new THREE.Color(palette.muted)
    mat.uniforms.u_color_c.value = new THREE.Color(palette.darkVibrant)
  }, [palette])

  // Update audio feature uniforms + drive beat timer
  useEffect(() => {
    const mat = materialRef.current
    if (!mat || !audioFeatures) return
    mat.uniforms.u_energy.value = audioFeatures.energy
    mat.uniforms.u_tempo.value = audioFeatures.tempo

    // BPM beat timer
    const beatInterval = (60 / audioFeatures.tempo) * 1000
    clearInterval(beatTimerRef.current)
    beatTimerRef.current = window.setInterval(() => {
      beatRef.current = 1.0
    }, beatInterval)

    return () => clearInterval(beatTimerRef.current)
  }, [audioFeatures])

  // Load album art texture
  useEffect(() => {
    const mat = materialRef.current
    if (!mat || !albumArtUrl) return
    const loader = new THREE.TextureLoader()
    loader.load(albumArtUrl, (tex) => {
      mat.uniforms.u_album_tex.value = tex
    })
  }, [albumArtUrl])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  )
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add Three.js scene with shader plane and post-processing"
```

---

### Task 7: Aurora shader

**Files:**
- Create: `components/visualizer/shaders/aurora.glsl`

**Step 1: Create `components/visualizer/shaders/aurora.glsl`**

```glsl
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

#define PI 3.14159265359

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), u.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 6; i++) {
    v += amp * noise(p * freq);
    freq *= 2.1;
    amp *= 0.48;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  float speed = u_tempo / 120.0 * 0.3;
  float t = u_time * speed;

  // Domain warp
  vec2 q = vec2(fbm(p + t * 0.5), fbm(p + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * t));

  float f = fbm(p + 4.0 * r);

  // Mix colors based on fbm field
  vec3 color = mix(u_color_c, u_color_b, clamp(f * f * 4.0, 0.0, 1.0));
  color = mix(color, u_color_a, clamp(length(q), 0.0, 1.0));
  color = mix(color, u_color_a * 1.5, clamp(length(r.x), 0.0, 1.0));

  // Energy influences brightness
  color *= 0.7 + u_energy * 0.6;

  // Beat flash
  color += u_beat * u_color_a * 0.3;

  // Vignette
  float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - 0.5));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add Aurora GLSL shader with fbm domain warping"
```

---

### Task 8: Pulse shader

**Files:**
- Create: `components/visualizer/shaders/pulse.glsl`

**Step 1: Create `components/visualizer/shaders/pulse.glsl`**

```glsl
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

#define PI 3.14159265359
#define TAU 6.28318530718

float circle(vec2 p, float r) {
  return length(p) - r;
}

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time;
  float bps = u_tempo / 60.0;

  vec3 color = u_color_c * 0.3;

  // Radial rings driven by beat
  for (int i = 0; i < 8; i++) {
    float phase = float(i) * 0.15;
    float r = mod(t * 0.4 + phase, 1.2);
    float ring = abs(length(p) - r * 1.5);
    float brightness = 1.0 - smoothstep(0.0, 0.06, ring);
    brightness *= 1.0 - r / 1.2;
    vec3 ringColor = mix(u_color_a, u_color_b, float(i) / 8.0);
    color += brightness * ringColor * (0.4 + u_energy * 0.6);
  }

  // Beat shockwave
  if (u_beat > 0.1) {
    float shockR = (1.0 - u_beat) * 2.0;
    float shock = 1.0 - smoothstep(0.0, 0.08, abs(length(p) - shockR));
    color += shock * u_color_a * u_beat * 2.0;

    // Chromatic aberration on beat
    float aberration = u_beat * 0.015;
    vec2 rOffset = normalize(p) * aberration;
    float rChannel = length(p - rOffset) - shockR;
    float bChannel = length(p + rOffset) - shockR;
    color.r += (1.0 - smoothstep(0.0, 0.1, abs(rChannel))) * u_beat;
    color.b += (1.0 - smoothstep(0.0, 0.1, abs(bChannel))) * u_beat;
  }

  // Center glow
  float glow = 0.05 / (length(p) + 0.01);
  color += glow * u_color_a * u_energy;

  // Vignette
  float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - 0.5));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add Pulse GLSL shader with beat-reactive shockwaves"
```

---

### Task 9: Nebula shader

**Files:**
- Create: `components/visualizer/shaders/nebula.glsl`

**Step 1: Create `components/visualizer/shaders/nebula.glsl`**

```glsl
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

#define PI 3.14159265359

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// Voronoi distance
float voronoi(vec2 p) {
  vec2 i_p = floor(p);
  vec2 f_p = fract(p);
  float minDist = 10.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = hash2(i_p + neighbor);
      point = 0.5 + 0.5 * sin(u_time * 0.3 + TAU * point);
      vec2 diff = neighbor + point - f_p;
      minDist = min(minDist, length(diff));
    }
  }
  return minDist;
}

#define TAU 6.28318530718

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1, 0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0, 1), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1, 1), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 0.12;

  // Domain warp for organic feel
  float warpX = noise(p * 1.5 + t);
  float warpY = noise(p * 1.5 + t + 5.2);
  vec2 warped = p + vec2(warpX, warpY) * 0.4;

  float v = voronoi(warped * 2.5 + t * 0.5);

  // Layer multiple voronoi scales
  float v2 = voronoi(warped * 4.0 - t * 0.3);

  float field = v * 0.6 + v2 * 0.4;

  // Color based on field value
  vec3 color = mix(u_color_c, u_color_b, smoothstep(0.0, 0.5, field));
  color = mix(color, u_color_a, smoothstep(0.3, 0.7, field));

  // Nebula glow on cell edges
  float edge = 1.0 - smoothstep(0.0, 0.15, v);
  color += edge * u_color_a * (0.5 + u_energy * 0.8);

  // Beat flash
  color += u_beat * 0.2 * u_color_a;

  // Vignette
  float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add Nebula GLSL shader with Voronoi domain warping"
```

---

### Task 10: Shader scene manager

**Files:**
- Create: `components/visualizer/VisualizerScene.tsx`

This is the top-level visualizer component. It picks which shader to use and auto-rotates between them. It imports shaders as strings and passes them to `Scene`.

**Step 1: Create `components/visualizer/VisualizerScene.tsx`**

```typescript
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import type { Palette } from '@/hooks/usePalette'
import type { AudioFeatures } from '@/hooks/useNowPlaying'

// Shaders imported as raw strings (requires webpack raw-loader config)
import auroraSrc from './shaders/aurora.glsl'
import pulseSrc from './shaders/pulse.glsl'
import nebulaSrc from './shaders/nebula.glsl'

const Scene = dynamic(
  () => import('./Scene').then(m => m.Scene),
  { ssr: false }
)

const SHADERS = [auroraSrc, pulseSrc, nebulaSrc]
const ROTATION_MS = 3.5 * 60 * 1000 // 3.5 minutes

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

  // Auto-rotate shaders on interval
  useEffect(() => {
    const id = setInterval(() => {
      setShaderIndex(i => (i + 1) % SHADERS.length)
    }, ROTATION_MS)
    return () => clearInterval(id)
  }, [])

  // Also rotate on track change
  useEffect(() => {
    if (trackId) {
      setShaderIndex(i => (i + 1) % SHADERS.length)
    }
  }, [trackId])

  return (
    <Scene
      palette={palette}
      audioFeatures={audioFeatures}
      albumArtUrl={albumArtUrl}
      shaderSrc={SHADERS[shaderIndex]}
    />
  )
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add shader scene manager with auto-rotation"
```

---

## Phase 3: UI Overlay

### Task 11: Album art component

**Files:**
- Create: `components/overlay/AlbumArt.tsx`

**Step 1: Create `components/overlay/AlbumArt.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface AlbumArtProps {
  url: string | null
  alt: string
}

export function AlbumArt({ url, alt }: AlbumArtProps) {
  const [displayUrl, setDisplayUrl] = useState(url)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    if (url === displayUrl) return

    // Dissolve out
    setOpacity(0)
    const timer = setTimeout(() => {
      setDisplayUrl(url)
      setOpacity(1)
    }, 600)

    return () => clearTimeout(timer)
  }, [url, displayUrl])

  if (!displayUrl) return (
    <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-2xl bg-white/5" />
  )

  return (
    <div
      className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        opacity,
        transition: 'opacity 0.6s ease',
      }}
    >
      <Image
        src={displayUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="320px"
        priority
      />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add AlbumArt component with dissolve transition"
```

---

### Task 12: Track info overlay

**Files:**
- Create: `components/overlay/TrackInfo.tsx`

**Step 1: Create `components/overlay/TrackInfo.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { NowPlayingData } from '@/lib/now-playing'
import type { Palette } from '@/hooks/usePalette'

interface TrackInfoProps {
  track: NowPlayingData | null
  palette: Palette
}

export function TrackInfo({ track, palette }: TrackInfoProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!track) return
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [track?.trackId])

  if (!track) return null

  return (
    <div
      className="flex flex-col gap-1"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      <p
        className="text-xs font-medium tracking-[0.2em] uppercase"
        style={{ color: palette.lightVibrant, opacity: 0.7 }}
      >
        {track.albumName}
      </p>
      <h1
        className="text-4xl lg:text-6xl font-bold text-white leading-tight"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        {track.trackName}
      </h1>
      <p
        className="text-xl lg:text-2xl font-light"
        style={{ color: palette.lightVibrant }}
      >
        {track.artistName}
      </p>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add TrackInfo overlay with stagger animation"
```

---

### Task 13: Progress bar

**Files:**
- Create: `components/overlay/ProgressBar.tsx`

**Step 1: Create `components/overlay/ProgressBar.tsx`**

```typescript
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

  // Interpolate progress between polls
  useEffect(() => {
    setLocalProgress(progressMs)
    if (!isPlaying) return

    intervalRef.current = setInterval(() => {
      setLocalProgress(p => Math.min(p + 500, durationMs))
    }, 500)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
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
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add ProgressBar with interpolated playback tracking"
```

---

### Task 14: Lyrics panel

**Files:**
- Create: `components/overlay/LyricsPanel.tsx`

**Step 1: Create `components/overlay/LyricsPanel.tsx`**

```typescript
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
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add LyricsPanel with synced line highlighting"
```

---

## Phase 4: Pages & Polish

### Task 15: TV mode page

**Files:**
- Create: `app/tv/page.tsx`

This is the main visualizer page. It composes all components.

**Step 1: Create `app/tv/page.tsx`**

```typescript
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
    return () => { window.removeEventListener('mousemove', show); clearTimeout(timer) }
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Spotify session verlopen</p>
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

      {/* Overlay */}
      <div className="relative z-10 flex h-full p-10 lg:p-16 gap-12">
        {/* Left column: album art + track info + progress */}
        <div className="flex flex-col justify-end gap-6 w-80 lg:w-96 shrink-0">
          <AlbumArt url={track?.albumArtUrl ?? null} alt={track?.albumName ?? ''} />
          <TrackInfo track={track} palette={palette} />
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

      {/* Nothing playing */}
      {!track?.isPlaying && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <p className="text-white/20 text-2xl tracking-widest uppercase">
            Niets aan het spelen
          </p>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add TV mode page composing all visualizer components"
```

---

### Task 16: Landing page (connect Spotify)

**Files:**
- Modify: `app/page.tsx`
- Create: `app/globals.css` (fonts)

**Step 1: Install fonts**

Add to `app/layout.tsx` — use `next/font/google` for DM Sans. For Clash Display (not on Google Fonts), add via CSS import or local font.

**Step 2: Update `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })

const clashDisplay = localFont({
  src: '../public/fonts/ClashDisplay-Variable.woff2',
  variable: '--font-clash',
})

export const metadata: Metadata = {
  title: 'Spotify Visualizer',
  description: 'A music art installation for your home bar',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className={`${dmSans.variable} ${clashDisplay.variable} font-sans bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

Note: Download Clash Display from [fontshare.com](https://www.fontshare.com/fonts/clash-display) and place `ClashDisplay-Variable.woff2` in `public/fonts/`.

**Step 3: Create landing page `app/page.tsx`**

```typescript
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const cookieStore = await cookies()
  const hasToken = cookieStore.has('spotify_access_token')

  if (hasToken) redirect('/tv')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-black pointer-events-none" />

      <div className="relative z-10 text-center flex flex-col items-center gap-10 px-6">
        <div className="flex flex-col gap-3">
          <h1
            className="text-6xl lg:text-8xl font-bold text-white"
            style={{ fontFamily: 'var(--font-clash)' }}
          >
            Spotify Viz
          </h1>
          <p className="text-white/40 text-lg tracking-wide">
            Een muzikale kunst-installatie voor jouw thuisbar
          </p>
        </div>

        <Link
          href="/api/auth/login"
          className="px-8 py-4 rounded-full text-black font-semibold text-lg"
          style={{ backgroundColor: '#1DB954' }}
        >
          Verbind met Spotify
        </Link>

        <p className="text-white/20 text-sm max-w-sm">
          Na verbinding word je automatisch doorgestuurd naar de TV-modus.
          Cast de pagina naar je TV via Chromecast.
        </p>
      </div>
    </div>
  )
}
```

**Step 4: Add radial gradient to Tailwind config**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
}

export default config
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add landing page with Spotify connect flow"
```

---

### Task 17: README and .env documentation

**Files:**
- Create: `README.md`

**Step 1: Create `README.md`**

```markdown
# Spotify Visualizer

Een fullscreen muziek-visualizer voor je thuisbar. Cast naar je TV via Chromecast.

## Setup

### 1. Spotify Developer App aanmaken

1. Ga naar [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in met je Spotify account
3. Klik **Create App**
4. Vul in:
   - App name: `Spotify Visualizer` (of wat je wilt)
   - Redirect URI: `http://localhost:3000/api/auth/callback` (voor lokaal)
   - Voor productie: `https://jouw-domein.vercel.app/api/auth/callback`
5. Sla op en kopieer je **Client ID** en **Client Secret**

### 2. Omgevingsvariabelen instellen

Kopieer `.env.example` naar `.env.local`:

```bash
cp .env.example .env.local
```

Vul in:

```env
SPOTIFY_CLIENT_ID=jouw_client_id
SPOTIFY_CLIENT_SECRET=jouw_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Fonts installeren

Download **Clash Display** van [fontshare.com](https://www.fontshare.com/fonts/clash-display)
en plaats `ClashDisplay-Variable.woff2` in `public/fonts/`.

### 4. Installeren en starten

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, klik **Verbind met Spotify** en je bent klaar.

## Gebruik

1. Zet muziek aan in Spotify
2. Open de app-URL in je browser
3. Klik **Verbind met Spotify**
4. De visualizer start automatisch
5. Cast de pagina naar je TV via de Chromecast-knop in Chrome

## Deployen naar Vercel

1. Push naar GitHub
2. Importeer in [vercel.com](https://vercel.com)
3. Voeg environment variables toe in de Vercel dashboard
4. Verander `SPOTIFY_REDIRECT_URI` naar `https://jouw-app.vercel.app/api/auth/callback`
5. Voeg die URL ook toe als Redirect URI in je Spotify Developer App
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with Spotify setup and deployment guide"
```

---

### Task 18: Final wiring and smoke test

**Step 1: Run all tests**

```bash
npm test
```

Expected: all tests pass

**Step 2: Start dev server**

```bash
npm run dev
```

**Step 3: Manual smoke test checklist**

- [ ] Landing page loads at `http://localhost:3000`
- [ ] "Verbind met Spotify" redirects to Spotify OAuth
- [ ] After auth, redirects to `/tv`
- [ ] Shader renders fullscreen
- [ ] Album art loads and shows
- [ ] Track info visible
- [ ] Progress bar moves
- [ ] Lyrics appear (if available for current track)
- [ ] Colors change with new track

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Spotify Visualizer MVP"
```

---

## Notes

- **No Web Playback SDK** — we only read playback state, not control it. This keeps the app simple and works with any Spotify client (phone, desktop, etc.)
- **Beat detection** is simulated via BPM timer — real-time audio analysis requires Premium + Web Playback SDK and is out of scope
- **GLSL shader imports** require the webpack rule in `next.config.ts` — without it, `.glsl` files won't import
- **node-vibrant** runs server-side only (in API routes) to avoid CORS issues with Spotify CDN image URLs
- **Chromecast** works natively in Chrome — user casts the browser tab. No special integration needed.
