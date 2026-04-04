/**
 * CSRF Token API - Generate CSRF tokens for authenticated users
 * Security: Tokens are tied to user session and expire after 1 hour
 */

import { NextRequest, NextResponse } from 'next/server';
import { USER_SESSION_COOKIE, verifyUserSessionToken } from '@/lib/user-session';
import { generateCsrfToken } from '@/lib/security';
import { logger } from '@/lib/logger';

// ─── GET /api/csrf ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = await verifyUserSessionToken(token);
    if (!payload?.sub) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Generate CSRF token tied to this user's session
    const csrfToken = generateCsrfToken(payload.sub);

    return NextResponse.json({
      success: true,
      data: { csrfToken }
    });
  } catch (error) {
    logger.error('CSRF token generation error', error as Error, { action: 'csrf_generate' });
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
