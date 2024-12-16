import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('Middleware checking auth...')
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true'
  const authExpiry = request.cookies.get('authExpiry')?.value

  // Allow access to passcode page and static assets
  if (request.nextUrl.pathname === '/passcode') {
    console.log('Allowing access to passcode page')
    return NextResponse.next()
  }

  // Check if user is authenticated and auth hasn't expired
  if (isAuthenticated && authExpiry) {
    const expiryTime = parseInt(authExpiry)
    if (new Date().getTime() < expiryTime) {
      console.log('Valid auth found, allowing access')
      return NextResponse.next()
    }
  }

  console.log('No valid auth found, redirecting to passcode')
  return NextResponse.redirect(new URL('/passcode', request.url))
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 