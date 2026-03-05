# Spotify Visualizer — Design Document

Date: 2026-03-05

## Concept

A fullscreen music art installation for a home bar / living room, cast to a TV via Chromecast. Anyone can connect their own Spotify account via OAuth. The screen becomes a living visual experience driven by the music: GPU-accelerated GLSL shaders react to tempo and energy, album art dissolves into the background, and synced lyrics float in the foreground.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Visual engine | Three.js + custom GLSL fragment shaders |
| Post-processing | Three.js EffectComposer (bloom, vignette, film grain) |
| Spotify | Web API — OAuth 2.0 Authorization Code (server-side via Next.js API routes) |
| Lyrics | LRCLIB API (free, synced LRC timestamps, no API key required) |
| Color extraction | node-vibrant (server-side, per album art fetch) |
| Hosting | Vercel |
| Styling | Tailwind CSS (UI overlay only) |
| Typography | Clash Display (titles) + DM Sans (meta) |

---

## Architecture

### Spotify OAuth Flow

- Next.js API routes handle all OAuth — `client_secret` never reaches the browser
- Tokens stored in httpOnly cookies; refresh handled transparently server-side
- No database required
- Any user opens the URL and connects their own Spotify account

### Data Polling

- `/me/player/currently-playing` polled every 3 seconds
- `/audio-features/{id}` fetched once per track (tempo, energy, danceability)
- On track change: trigger color extraction + lyrics fetch in parallel

### Color Extraction

- API route fetches album art server-side, runs node-vibrant
- Returns palette of 5 colors (dominant, vibrant, muted, dark vibrant, dark muted)
- Colors injected as shader uniforms via `u_color_*`

### Lyrics

- LRCLIB queried by artist + title
- Returns timestamped lines (LRC format)
- Client tracks playback position and highlights active line
- Fallback: plain text lyrics if synced unavailable
- Fallback: no lyrics panel if nothing found

---

## Visual Engine

### Scene Structure

Fullscreen `PlaneGeometry` covering the viewport. All visuals live inside a single fragment shader — no 3D geometry. WebGL renderer with `preserveDrawingBuffer: true` for Chromecast compatibility.

### Three Shader Scenes (auto-rotate every 3-4 minutes or on track change)

**1. Fluid Aurora**
Simplex noise + fractional Brownian motion (fbm). Slow, flowing plasma-cloud movement in album palette colors. Calm, hypnotic. Suits any tempo.

**2. Reactive Pulse**
Radial shockwaves timed to BPM. Chromatic aberration spike on each beat. More energetic, suited to higher-energy tracks. Beat detected via BPM timer derived from `tempo` audio feature.

**3. Nebula Drift**
Voronoi patterns + domain warping. Organic, spatial, slow-moving. Best as idle/screensaver mode.

### Shader Uniforms (music-driven)

| Uniform | Source | Effect |
|---|---|---|
| `u_time` | requestAnimationFrame | Animation clock |
| `u_energy` | Spotify audio features | Movement amplitude |
| `u_tempo` | Spotify audio features | Pulse speed |
| `u_beat` | BPM timer (float 0→1) | Beat flash intensity |
| `u_color_a/b/c` | node-vibrant palette | Shader color fields |
| `u_album_tex` | Album art texture | Morphed into background |
| `u_transition` | Track change timer | Cross-fade uniform |

### Post-Processing Pipeline

`EffectComposer` → UnrealBloomPass (glow) → VignetteShader → FilmPass (grain)

---

## Layout & UI Layers

```
[ Three.js canvas — fullscreen, z-index 0 ]
[ Album art — large, center-left, dissolve transition ]
[ Track info overlay — glassmorphism panel ]
[ Lyrics panel — right or bottom, active line highlighted ]
[ Progress bar — bottom edge, subtle ]
```

### Typography

- Track title: large, bold — Clash Display
- Artist: small, uppercase, spaced — DM Sans
- Album: small, italic, dimmed — DM Sans
- Lyrics active line: large, accent color, lit up
- Lyrics surrounding lines: small, low opacity

### Track Transition Sequence

1. Shader palette morphs to new colors (~2s ease)
2. Album art pixel-dissolve out, new art floats in
3. Text elements stagger-fade out/in
4. Lyrics panel resets to top

---

## TV Mode

Route: `/tv` or `?mode=tv`

- No navigation, no buttons
- Cursor hidden after 3 seconds of inactivity
- All text scaled up for 3m viewing distance
- Idle animation when nothing is playing
- Designed for 16:9 screens at 1080p / 4K

---

## Project Structure

```
spotify-viz/
├── app/
│   ├── page.tsx                  # Landing / connect Spotify
│   ├── tv/page.tsx               # TV visualizer mode
│   ├── api/
│   │   ├── auth/callback/        # OAuth callback
│   │   ├── auth/login/           # Redirect to Spotify
│   │   ├── auth/refresh/         # Token refresh
│   │   ├── now-playing/          # Current track + audio features
│   │   ├── lyrics/               # LRCLIB proxy
│   │   └── palette/              # node-vibrant color extraction
├── components/
│   ├── visualizer/
│   │   ├── Scene.tsx             # Three.js canvas setup
│   │   ├── ShaderBackground.tsx  # Fragment shader plane
│   │   ├── shaders/
│   │   │   ├── aurora.glsl
│   │   │   ├── pulse.glsl
│   │   │   └── nebula.glsl
│   │   └── PostProcessing.tsx
│   ├── overlay/
│   │   ├── AlbumArt.tsx
│   │   ├── TrackInfo.tsx
│   │   ├── LyricsPanel.tsx
│   │   └── ProgressBar.tsx
│   └── ui/
│       └── ConnectButton.tsx
├── hooks/
│   ├── useNowPlaying.ts          # Polling hook
│   ├── useLyrics.ts              # Lyrics sync hook
│   ├── usePalette.ts             # Color palette hook
│   └── useBeatTimer.ts           # BPM-based beat clock
├── lib/
│   ├── spotify.ts                # API client + token logic
│   ├── lrclib.ts                 # Lyrics fetcher/parser
│   └── vibrant.ts                # Server-side color extraction
├── .env.local                    # Spotify credentials (gitignored)
├── .env.example                  # Template for users
└── README.md
```

---

## Environment Variables

```env
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Constraints & Decisions

- **No database** — stateless, cookie-based auth. Simple deployment.
- **No Web Playback SDK** — we only read what's playing, not control it. Lower complexity, works with any Spotify client.
- **LRCLIB over Genius/Musixmatch** — free, no API key, has synced timestamps.
- **Server-side color extraction** — avoids CORS issues with Spotify CDN images.
- **GLSL over Canvas 2D** — GPU-accelerated, runs smoothly for hours on low-end hardware.
