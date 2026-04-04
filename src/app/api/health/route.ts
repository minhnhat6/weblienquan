/**
 * GET /api/health - Health check with database connectivity test
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const checks = {
    server: 'ok',
    database: 'unknown',
    error: null as string | null,
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
    },
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1 as test`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    checks.error = error instanceof Error ? error.message : 'Unknown database error';
  }

  const status = checks.database === 'ok' ? 200 : 500;
  
  return NextResponse.json(checks, { status });
}
