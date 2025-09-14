// src/app/api/billing/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get('session_id')
  return NextResponse.json({ ok: true, stage: 'ping', sessionId })
}
