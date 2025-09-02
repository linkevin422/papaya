// /middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Right now this does nothing except let every request pass through.
// You can add checks back later if you need them.
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|assets).*)'],
}
