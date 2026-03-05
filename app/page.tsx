import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const cookieStore = await cookies()
  const hasToken = cookieStore.has('spotify_access_token')

  if (hasToken) redirect('/tv')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-black pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-6xl lg:text-8xl font-bold text-white tracking-tight">
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

        <p className="text-white/20 text-sm max-w-sm leading-relaxed">
          Na verbinding word je automatisch doorgestuurd naar de TV-modus.
          Cast de pagina naar je TV via Chromecast.
        </p>
      </div>
    </main>
  )
}
