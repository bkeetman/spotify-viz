import { NextResponse } from 'next/server'

// Module-level state — persists in warm serverless instances.
// Resets on cold start (~once/day if idle), which is fine for home use.
let command: { action: string; ts: number } | null = null

export async function POST(req: Request) {
  const { action } = await req.json()
  command = { action, ts: Date.now() }
  return NextResponse.json({ ok: true })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const since = Number(url.searchParams.get('since') ?? '0')
  if (command && command.ts > since) {
    const result = { ...command }
    command = null // consume once
    return NextResponse.json(result)
  }
  return NextResponse.json(null)
}
