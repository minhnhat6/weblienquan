/**
 * POST /api/auth/logout - User Logout API
 */

import { NextResponse } from 'next/server';
import { USER_SESSION_COOKIE } from '@/lib/user-session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.delete(USER_SESSION_COOKIE);

  return response;
}
