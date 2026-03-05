# Spotify Visualizer

Een fullscreen muziek-visualizer voor je thuisbar. Cast naar je TV via Chromecast.

## Setup

### 1. Spotify Developer App aanmaken

1. Ga naar [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in met je Spotify account
3. Klik **Create App**
4. Vul in:
   - App name: `Spotify Visualizer` (of wat je wilt)
   - App description: iets beschrijvends
   - Redirect URI: `http://localhost:3000/api/auth/callback` (voor lokaal)
   - Voor productie op Vercel: `https://jouw-app.vercel.app/api/auth/callback`
5. Sla op en kopieer je **Client ID** en **Client Secret**

### 2. Omgevingsvariabelen instellen

Kopieer `.env.example` naar `.env.local`:

```bash
cp .env.example .env.local
```

Open `.env.local` en vul in:

```env
SPOTIFY_CLIENT_ID=jouw_client_id
SPOTIFY_CLIENT_SECRET=jouw_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Installeren en starten

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, klik **Verbind met Spotify** en je bent klaar.

## Gebruik

1. Zet muziek aan via Spotify (op je telefoon, computer of speaker)
2. Open de app-URL in je browser
3. Klik **Verbind met Spotify** en log in
4. De visualizer start automatisch
5. Cast de browsertab naar je TV via de Chromecast-knop in Chrome

## Deployen naar Vercel

1. Push je project naar GitHub
2. Importeer het project op [vercel.com](https://vercel.com)
3. Voeg de volgende environment variables toe in het Vercel dashboard:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REDIRECT_URI` → `https://jouw-app.vercel.app/api/auth/callback`
   - `NEXT_PUBLIC_APP_URL` → `https://jouw-app.vercel.app`
4. Voeg de Vercel-URL ook toe als Redirect URI in je Spotify Developer App
5. Deploy!

## Tech stack

- **Next.js 16** — App Router, TypeScript
- **Three.js + GLSL** — GPU-accelerated shader visuals
- **Spotify Web API** — OAuth 2.0, now playing, audio features
- **LRCLIB** — Gratis gesynchroniseerde lyrics
- **node-vibrant** — Kleurpaletten uit album art
- **Vercel** — Hosting
