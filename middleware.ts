import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/server-session';

// ─── Security Helpers ──────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure nonce for CSP
 * Uses Web Crypto API which is available in Edge Runtime
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Validate redirect URL to prevent open redirect attacks
 * Only allows relative URLs starting with /admin/
 */
function isValidAdminRedirectUrl(url: string): boolean {
  // Must be a non-empty string starting with /admin
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('/admin')) return false;
  
  // Block protocol-relative URLs (//evil.com)
  if (url.includes('//')) return false;
  
  // Block path traversal
  if (url.includes('..')) return false;
  
  // Block newlines and other control characters
  if (/[\n\r\t]/.test(url)) return false;
  
  return true;
}

// ─── Middleware ────────────────────────────────────────────────────────────────

// Blocked HTTP methods for security
const BLOCKED_METHODS = ['TRACE', 'TRACK', 'CONNECT'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block dangerous HTTP methods (TRACE, TRACK, CONNECT)
  if (BLOCKED_METHODS.includes(req.method.toUpperCase())) {
    return new NextResponse(null, { 
      status: 405, 
      statusText: 'Method Not Allowed',
      headers: { 'Allow': 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' }
    });
  }

  // Generate nonce for CSP
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === 'development';

  // Apply security headers to all responses
  const response = await handleAdminAuth(req, pathname);
  
  // Pass nonce to server components via header
  response.headers.set('x-nonce', nonce);
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  // Next.js on Vercel uses dynamic script chunks that don't support strict nonce-based CSP
  // Using a balanced approach: self + unsafe-inline for scripts (required for Next.js hydration)
  const csp = isDev
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' ws: wss: https://challenges.cloudflare.com",
        "frame-src https://challenges.cloudflare.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    : [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://challenges.cloudflare.com",
        "frame-src https://challenges.cloudflare.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

async function handleAdminAuth(req: NextRequest, pathname: string) {
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Skip auth check for login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifyAdminSessionToken(token);

  if (!payload) {
    const loginUrl = new URL('/admin/login', req.url);
    // Validate redirect URL to prevent open redirect attacks
    if (isValidAdminRedirectUrl(pathname)) {
      loginUrl.searchParams.set('redirect', pathname);
    } else {
      loginUrl.searchParams.set('redirect', '/admin/dashboard');
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
