/**
 * Admin Session API - Login, verify, and logout for admin panel
 * Security: Bcrypt-hashed passwords, timing-safe comparison, rate limiting, MFA
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, verifyAdminSessionToken } from '@/lib/server-session';
import { loginRateLimiter } from '@/lib/rate-limiter';
import { logEvent, logError, logger } from '@/lib/logger';
import { verifyMFA, getMFAConfig } from '@/lib/mfa/totp';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LoginBody {
  username?: string;
  password?: string;
  mfaToken?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SESSION_DURATION_HOURS = 12;
const SESSION_DURATION_SECONDS = 60 * 60 * SESSION_DURATION_HOURS;

const ERROR = {
  RATE_LIMITED: (resetIn: number | undefined) => `Quá nhiều lần thử. Vui lòng đợi ${resetIn ?? 60} giây.`,
  INVALID_CREDENTIALS: 'Sai tên đăng nhập hoặc mật khẩu',
  INVALID_REQUEST: 'Yêu cầu không hợp lệ',
  NOT_CONFIGURED: 'Admin credentials not properly configured',
  MFA_REQUIRED: 'Yêu cầu mã xác thực 2 yếu tố',
  MFA_INVALID: 'Mã xác thực không hợp lệ',
} as const;

// ─── Security Helpers ──────────────────────────────────────────────────────────

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do comparison to maintain constant time
    for (let i = 0; i < a.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Get admin credentials securely
 * In production, ADMIN_PASSWORD_HASH should be a bcrypt hash
 * Generate with: node -e "require('bcryptjs').hash('yourpassword', 10).then(console.log)"
 */
function getAdminCredentials(): { username: string; passwordHash: string } | null {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  
  // In production, require hashed password
  if (process.env.NODE_ENV === 'production') {
    if (!username || !passwordHash) {
      logger.security('ADMIN_USERNAME and ADMIN_PASSWORD_HASH must be set in production');
      return null;
    }
    return { username, passwordHash };
  }
  
  // In development, allow plain password for convenience
  // Dev hash placeholder - bcrypt.compare will verify against ADMIN_INIT_PASS
  const devHash = '$2a$10$devhashplaceholder';
  
  return {
    username: username || 'admin',
    passwordHash: passwordHash || devHash,
  };
}

/**
 * Verify admin credentials with timing-safe comparison
 */
async function verifyAdminCredentials(inputUsername: string, inputPassword: string): Promise<boolean> {
  const creds = getAdminCredentials();
  if (!creds) return false;
  
  // Timing-safe username comparison
  const usernameMatch = timingSafeEqual(inputUsername, creds.username);
  
  // In development without hash, allow plain password comparison
  if (process.env.NODE_ENV !== 'production' && !process.env.ADMIN_PASSWORD_HASH) {
    const devPassword = process.env.ADMIN_INIT_PASS || 'admin';
    const passwordMatch = timingSafeEqual(inputPassword, devPassword);
    return usernameMatch && passwordMatch;
  }
  
  // Bcrypt comparison (already timing-safe)
  const passwordMatch = await bcrypt.compare(inputPassword, creds.passwordHash);
  
  return usernameMatch && passwordMatch;
}

// ─── Other Helpers ─────────────────────────────────────────────────────────────

function getRateLimitKey(username: string | undefined): string {
  return `admin-login:${username ?? 'unknown'}`;
}

function extractTokenFromCookies(cookieHeader: string): string {
  const tokenPart = cookieHeader
    .split(';')
    .map(v => v.trim())
    .find(v => v.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  return tokenPart ? tokenPart.split('=').slice(1).join('=') : '';
}

function createCookieOptions(maxAge: number) {
  return {
    name: ADMIN_SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

// ─── POST - Admin Login ────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    
    // Validate input
    if (!body.username || !body.password) {
      return NextResponse.json(
        { success: false, error: ERROR.INVALID_REQUEST },
        { status: 400 }
      );
    }
    
    const rateLimitKey = getRateLimitKey(body.username);

    const rateLimitResult = loginRateLimiter.check(rateLimitKey);
    if (!rateLimitResult.allowed) {
      logError.rateLimitExceeded(rateLimitKey);
      return NextResponse.json(
        {
          success: false,
          error: ERROR.RATE_LIMITED(rateLimitResult.resetIn),
          resetIn: rateLimitResult.resetIn,
        },
        { status: 429 }
      );
    }

    // Verify credentials using timing-safe comparison + bcrypt
    const isValid = await verifyAdminCredentials(body.username, body.password);
    
    if (!isValid) {
      loginRateLimiter.recordFailure(rateLimitKey);
      logError.authFailed(body.username, 'Invalid credentials');
      return NextResponse.json(
        { success: false, error: ERROR.INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    // Check MFA if enabled
    const mfaConfig = getMFAConfig();
    if (mfaConfig.enabled) {
      if (!body.mfaToken) {
        // Return MFA required response
        return NextResponse.json(
          { 
            success: false, 
            error: ERROR.MFA_REQUIRED,
            mfaRequired: true,
          },
          { status: 401 }
        );
      }
      
      const mfaResult = verifyMFA(body.mfaToken, mfaConfig);
      if (!mfaResult.valid) {
        loginRateLimiter.recordFailure(rateLimitKey);
        logError.authFailed(body.username, 'Invalid MFA token');
        return NextResponse.json(
          { success: false, error: ERROR.MFA_INVALID },
          { status: 401 }
        );
      }
      
      // Log if backup code was used
      if (mfaResult.usedBackupCode) {
        logEvent.adminLogin(`${body.username} (backup code used)`);
      }
    }

    loginRateLimiter.clear(rateLimitKey);
    logEvent.adminLogin(body.username);

    const creds = getAdminCredentials();
    const adminUsername = creds?.username || body.username;
    
    const token = await createAdminSessionToken({
      sub: 'admin-001',
      username: adminUsername,
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: { username: adminUsername, role: 'admin' },
      },
    });

    response.cookies.set({
      ...createCookieOptions(SESSION_DURATION_SECONDS),
      value: token,
    });

    return response;

  } catch {
    return NextResponse.json(
      { success: false, error: ERROR.INVALID_REQUEST },
      { status: 400 }
    );
  }
}

// ─── GET - Verify Session ──────────────────────────────────────────────────────

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = extractTokenFromCookies(cookieHeader);
  const payload = await verifyAdminSessionToken(token);

  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    role: payload.role,
    username: payload.username,
  });
}

// ─── DELETE - Logout ───────────────────────────────────────────────────────────

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({ ...createCookieOptions(0), value: '' });
  return response;
}
