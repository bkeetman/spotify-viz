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
  let activeIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].timeMs <= progressMs) activeIndex = i
    else break
  }
  return activeIndex
}
