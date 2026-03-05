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

    // Dissolve out, swap, dissolve in
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
