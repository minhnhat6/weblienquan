/**
 * GET /api/health - Health Check API
 * Tests database connectivity and returns system status
 * 
 * SECURITY: Only exposes minimal info publicly.
 * Detailed checks require admin authentication in production.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminSession } from '@/lib/server-session';

export async function GET(request: Request) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Basic health check (always public)
  const publicChecks: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1 as check_val`;
    publicChecks.database = 'connected';
  } catch {
    publicChecks.database = 'error';
    publicChecks.status = 'unhealthy';
  }

  // In production, detailed info requires admin auth
  if (isProduction) {
    const session = await validateAdminSession(request);
    if (!session) {
      // Return minimal info for unauthenticated requests
      const statusCode = publicChecks.status === 'ok' ? 200 : 503;
      return NextResponse.json(publicChecks, { status: statusCode });
    }
  }

  // Detailed checks (dev or authenticated admin in prod)
  const detailedChecks: Record<string, string> = {
    ...publicChecks,
    nodeEnv: process.env.NODE_ENV || 'unknown',
    // Only show if env vars are SET, not their values
    configStatus: [
      process.env.DATABASE_URL ? '✓db' : '✗db',
      process.env.SESSION_SECRET ? '✓session' : '✗session',
      process.env.ADMIN_USERNAME ? '✓admin' : '✗admin',
    ].join(' '),
  };

  const statusCode = detailedChecks.status === 'ok' ? 200 : 503;
  return NextResponse.json(detailedChecks, { status: statusCode });
}
