import { logger } from '@/lib/logger';
/**
 * Admin Recharge API - List all recharge requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminSession } from '@/lib/server-session';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

const ERROR = {
  UNAUTHORIZED: 'Unauthorized',
  GET_FAILED: 'Failed to get recharge requests',
} as const;

const USER_SELECT = {
  username: true,
  email: true,
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function getPaginationParams(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE));
  const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
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

// ─── GET Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await validateAdminSession(request);
    if (!session) {
      return errorResponse(ERROR.UNAUTHORIZED, 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where = status === 'all' ? {} : { status };

    const [recharges, total] = await Promise.all([
      prisma.rechargeRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: USER_SELECT } },
      }),
      prisma.rechargeRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        recharges,
        pagination: buildPagination(page, limit, total),
      },
    });

  } catch (error) {
    logger.error('Get recharges error', error as Error, { action: 'get_recharges' });
    return errorResponse(ERROR.GET_FAILED, 500);
  }
}
