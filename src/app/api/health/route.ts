/**
 * GET /api/health - Health Check API
 * Tests database connectivity and returns system status
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const checks: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'unknown',
  };

  // Check environment variables
  checks.hasDbUrl = process.env.DATABASE_URL ? 'yes' : 'NO';
  checks.hasSessionSecret = process.env.SESSION_SECRET ? 'yes' : 'NO';
  checks.hasTurnstileKey = process.env.TURNSTILE_SECRET_KEY ? 'yes' : 'NO';
  checks.hasAdminUsername = process.env.ADMIN_USERNAME ? 'yes' : 'NO';

  // Test database connection
  try {
    const result = await prisma.$queryRaw`SELECT 1 as check_val`;
    checks.database = 'connected';
    checks.dbResult = JSON.stringify(result);
  } catch (error) {
    checks.database = 'FAILED';
    checks.dbError = error instanceof Error ? error.message : 'Unknown error';
    checks.status = 'unhealthy';
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
