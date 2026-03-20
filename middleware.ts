import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://stock-portfolio-ruby-five.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isApiRequest = request.nextUrl.pathname.startsWith('/api');

  if (!isApiRequest) {
    return NextResponse.next();
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    let allowedOrigin = ALLOWED_ORIGINS[0];

    if (origin) {
      const isAllowed = 
        ALLOWED_ORIGINS.includes(origin) ||
        origin.includes('.vercel.app') ||
        /localhost:\d+$/.test(origin) ||
        /127\.0\.0\.1:\d+$/.test(origin) ||
        process.env.NODE_ENV === 'development';

      if (isAllowed) {
        allowedOrigin = origin;
      }
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, x-requested-with',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = NextResponse.next();

  // Add CORS headers to the response
  if (origin) {
    const isAllowed = 
        ALLOWED_ORIGINS.includes(origin) ||
        origin.includes('.vercel.app') ||
        /localhost:\d+$/.test(origin) ||
        /127\.0\.0\.1:\d+$/.test(origin) ||
        process.env.NODE_ENV === 'development';

    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, x-requested-with');
    }
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
