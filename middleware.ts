import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC = new Set([
  '/login',
  '/register',
  '/auth/callback',
  '/favicon.ico',
])

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // static / next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images')
  ) return NextResponse.next()

  // always allow these
  if (PUBLIC.has(pathname)) return NextResponse.next()

  // check Supabase auth cookies (set by the callback route)
  const hasAccess = !!req.cookies.get('sb-access-token')?.value

  // auth required
  if (!hasAccess) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // optional: if logged in and visiting /login or /register (when nested or dynamic)
  if (hasAccess && (pathname === '/login' || pathname === '/register')) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|assets).*)'],
}
