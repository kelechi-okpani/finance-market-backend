import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://finance-market.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const path = request.nextUrl.pathname;

  // Only handle API routes
  if (!path.startsWith('/api')) {
    return NextResponse.next();
  }

  // Let individual routes handle OPTIONS and CORS
  // The middleware shouldn't intercept and return early if we want consistency
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
