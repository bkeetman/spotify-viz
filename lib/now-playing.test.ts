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
