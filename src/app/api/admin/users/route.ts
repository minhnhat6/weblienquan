import { logger } from '@/lib/logger';
/**
 * Admin Users API - List and manage users
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminSession } from '@/lib/server-session';
import { adminApiRateLimiter } from '@/lib/rate-limiter';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_PAGE = 10000;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 100;

const ERROR = {
  UNAUTHORIZED: 'Unauthorized',
  GET_FAILED: 'Failed to get users',
  SEARCH_TOO_LONG: 'Search query too long',
  INVALID_PAGINATION: 'Invalid pagination parameters',
  RATE_LIMITED: 'Too many requests. Please try again later.',
} as const;

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  balance: true,
  discount: true,
  spinTickets: true,
  createdAt: true,
  _count: {
    select: { orders: true, transactions: true },
  },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
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
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

function buildSearchFilter(search: string) {
  if (!search) return {};
  return {
    OR: [
      { username: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ],
  };
}

// ─── GET Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await validateAdminSession(request);
    if (!session) {
      return errorResponse(ERROR.UNAUTHORIZED, 401);
    }

    // Rate limiting for admin API
    const rateLimitKey = `admin-users:${session.username}`;
    const rateLimit = adminApiRateLimiter.check(rateLimitKey);
    if (!rateLimit.allowed) {
      return errorResponse(ERROR.RATE_LIMITED, 429);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    // Validate search length to prevent DoS attacks
    if (search.length > MAX_SEARCH_LENGTH) {
      return errorResponse(ERROR.SEARCH_TOO_LONG, 400);
    }
    
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where = buildSearchFilter(search);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: USER_SELECT,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: buildPagination(page, limit, total),
      },
    });

  } catch (error) {
    logger.error('Get users error', error as Error, { action: 'get_users' });
    return errorResponse(ERROR.GET_FAILED, 500);
  }
}
