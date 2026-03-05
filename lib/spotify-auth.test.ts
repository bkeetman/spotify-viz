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
