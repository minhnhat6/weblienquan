/**
 * Transactions API - Get user's transaction history
 * Security: Validates HMAC-signed session token
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { USER_SESSION_COOKIE, verifyUserSessionToken } from '@/lib/user-session';
import { logger } from '@/lib/logger';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_PAGE = 10000;
const MAX_LIMIT = 100;

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  
  const payload = await verifyUserSessionToken(token);
  return payload?.sub ?? null;
}

function getPaginationParams(searchParams: URLSearchParams) {
  const rawPage = parseInt(searchParams.get('page') || String(DEFAULT_PAGE));
  const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
  
  // Clamp values to prevent DoS via excessive pagination
  const page = Math.min(Math.max(1, isNaN(rawPage) ? DEFAULT_PAGE : rawPage), MAX_PAGE);
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit), MAX_LIMIT);
  
  return { page, limit, skip: (page - 1) * limit };
}

function buildPagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

// ─── GET Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return unauthorizedError('Not authenticated');
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return successResponse({
      transactions,
      pagination: buildPagination(page, limit, total),
    });

  } catch (error) {
    logger.error('Get transactions error', error as Error, { action: 'get_transactions' });
    return serverError('Failed to get transactions');
  }
}
