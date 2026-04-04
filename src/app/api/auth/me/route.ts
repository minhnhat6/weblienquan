import { logger } from '@/lib/logger';
/**
 * GET /api/auth/me - Get Current User Info
 * Security: Validates HMAC-signed session token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/auth-db';
import { USER_SESSION_COOKIE, verifyUserSessionToken } from '@/lib/user-session';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ERROR = {
  NOT_AUTHENTICATED: 'Not authenticated',
  USER_NOT_FOUND: 'User not found',
  GET_FAILED: 'Failed to get user info',
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  
  const payload = await verifyUserSessionToken(token);
  return payload?.sub ?? null;
}

// ─── GET Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);

    if (!userId) {
      return errorResponse(ERROR.NOT_AUTHENTICATED, 401);
    }

    const user = await getUserById(userId);

    if (!user) {
      return errorResponse(ERROR.USER_NOT_FOUND, 404);
    }

    return NextResponse.json({ success: true, data: { user } });

  } catch (error) {
    logger.error('Get user error', error as Error, { action: 'get_me' });
    return errorResponse(ERROR.GET_FAILED, 500);
  }
}
