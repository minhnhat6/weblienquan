import { logger, logError } from '@/lib/logger';
/**
 * POST /api/auth/login - User Login API
 * Uses bcrypt for password verification
 * Security: Uses HMAC-signed session tokens (not plain userId)
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth-db';
import { logBusinessEvent } from '@/lib/observability-helper';
import { sanitizeInput, checkRateLimit, clearLoginFailures, recordLoginFailure } from '@/lib/security';
import { 
  createUserSessionToken, 
  getUserSessionCookieOptions,
  USER_SESSION_COOKIE 
} from '@/lib/user-session';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ERROR = {
  MISSING_CREDENTIALS: 'Missing username or password',
  RATE_LIMITED: 'Too many login attempts. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid username or password',
  LOGIN_FAILED: 'Login failed',
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function isInvalidCredentialsError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Invalid');
}

async function setSessionCookie(response: NextResponse, userId: string, username: string): Promise<void> {
  const token = await createUserSessionToken(userId, username);
  const options = getUserSessionCookieOptions();
  response.cookies.set(USER_SESSION_COOKIE, token, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    maxAge: options.maxAge,
    path: options.path,
  });
}

// ─── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let sanitizedUsername = '';
  
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return errorResponse(ERROR.MISSING_CREDENTIALS, 400);
    }

    sanitizedUsername = sanitizeInput(username);

    if (!checkRateLimit(sanitizedUsername)) {
      return errorResponse(ERROR.RATE_LIMITED, 429);
    }

    const user = await loginUser({
      username: sanitizedUsername,
      password,
    });

    clearLoginFailures(sanitizedUsername);

    logBusinessEvent('user_login', {
      userId: user.id,
      username: user.username,
    });

    const response = NextResponse.json({
      success: true,
      data: { user },
    });

    await setSessionCookie(response, user.id, user.username);

    return response;

  } catch (error) {
    logger.error('Login error', error as Error, { action: 'login' });

    if (isInvalidCredentialsError(error)) {
      // Log failed login attempt for security monitoring
      if (sanitizedUsername) {
        logError.authFailed(sanitizedUsername, 'Invalid credentials');
        recordLoginFailure(sanitizedUsername);
      }
      return errorResponse(ERROR.INVALID_CREDENTIALS, 401);
    }

    return errorResponse(ERROR.LOGIN_FAILED, 500);
  }
}
