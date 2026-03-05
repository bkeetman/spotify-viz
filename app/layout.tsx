import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'Spotify Visualizer',
  description: 'Een muzikale kunst-installatie voor jouw thuisbar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className={`${dmSans.variable} font-sans bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
