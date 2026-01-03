import { NextResponse } from 'next/server';

export function middleware(request) {
  // TEMPORARILY DISABLED FOR DEVELOPMENT
  // All routes are accessible without auth
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and api
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
