import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth';

/**
 * /dashboard ve alt sayfalarını korur.
 * Giriş yapılmamışsa /login'e yönlendirir.
 */
export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;

  if (!authCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
