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
