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
