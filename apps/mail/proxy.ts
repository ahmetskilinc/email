import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/mail') || pathname.startsWith('/settings')) {
    const prefix = process.env.NODE_ENV === 'development' ? 'better-auth-dev' : 'better-auth';
    const sessionCookie = request.cookies.get(`${prefix}.session_token`) ??
                          request.cookies.get(`__Secure-${prefix}.session_token`)

    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/mail/:path*', '/settings/:path*'],
}
