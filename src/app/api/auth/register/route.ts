import { logger } from '@/lib/logger';
/**
 * POST /api/auth/register - User Registration API
 * Uses bcrypt for password hashing
 * Security: Password length validation + rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth-db';
import { logBusinessEvent } from '@/lib/observability-helper';
import { sanitizeInput, validatePassword, validateEmail } from '@/lib/security';
import { loginRateLimiter } from '@/lib/rate-limiter';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ERROR = {
  MISSING_FIELDS: 'Missing required fields',
  RATE_LIMITED: 'Too many registration attempts. Please try again later.',
  REGISTRATION_FAILED: 'Registration failed',
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function isConflictError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('already exists');
}

/**
 * Validate IP address format to prevent header injection
 */
function isValidIpAddress(ip: string): boolean {
  // IPv4: 0-255.0-255.0-255.0-255
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 simplified validation
  const ipv6Regex = /^(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Extract client IP from request headers with validation
 * Priority: Cloudflare > X-Real-IP > X-Forwarded-For (first IP only)
 */
function getClientIp(request: NextRequest): string {
  // Cloudflare provides the actual client IP
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp && isValidIpAddress(cfConnectingIp)) {
    return cfConnectingIp;
  }
  
  // Trusted proxy header
  const realIp = request.headers.get('x-real-ip');
  if (realIp && isValidIpAddress(realIp)) {
    return realIp;
  }
  
  // X-Forwarded-For: Take only the first IP and validate
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp && isValidIpAddress(firstIp)) {
      return firstIp;
    }
  }
  
  // Fallback - use request.ip if available (Next.js)
  // @ts-expect-error - ip may not exist on all Next.js versions
  const requestIp = request.ip;
  if (requestIp && isValidIpAddress(requestIp)) {
    return requestIp;
  }
  
  return 'unknown';
}

// ─── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP to prevent registration spam
    const clientIp = getClientIp(request);
    const rateLimitKey = `register:${clientIp}`;
    const rateLimit = loginRateLimiter.check(rateLimitKey);
    
    if (!rateLimit.allowed) {
      return errorResponse(ERROR.RATE_LIMITED, 429);
    }

    const { username, email, password, referredBy } = await request.json();

    if (!username || !email || !password) {
      return errorResponse(ERROR.MISSING_FIELDS, 400);
    }

    const sanitizedUsername = sanitizeInput(username);
    const trimmedEmail = email.trim();

    // Validate email format
    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      return errorResponse(emailError, 400);
    }

    // Validate password policy (minimum 6 chars, maximum 64 chars)
    const passwordError = validatePassword(password);
    if (passwordError) {
      return errorResponse(passwordError, 400);
    }

    const user = await registerUser({
      username: sanitizedUsername,
      email: trimmedEmail,
      password,
      referredBy: referredBy ? sanitizeInput(referredBy) : undefined,
    });

    logBusinessEvent('user_registered', {
      userId: user.id,
      username: user.username,
      referredBy: user.referredBy,
    });

    return NextResponse.json({ success: true, data: { user } });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error securely (no console.log with sensitive data)
    logger.error('Register error', error as Error, { action: 'register' });
    
    // Record failed attempt for rate limiting
    const clientIp = getClientIp(request);
    loginRateLimiter.recordFailure(`register:${clientIp}`);

    if (isConflictError(error)) {
      // Generic message to prevent user enumeration
      return errorResponse('Username or email already registered', 409);
    }

    // Check for database connection errors
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('SSL') || errorMessage.includes('timeout')) {
      return errorResponse('Service temporarily unavailable. Please try again later.', 503);
    }

    // Always return generic error in production
    return errorResponse(ERROR.REGISTRATION_FAILED, 500);
  }
}
