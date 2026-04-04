import { logger } from '@/lib/logger';
/**
 * Admin User Detail API - Get/Update specific user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminSession } from '@/lib/server-session';
import { logBusinessEvent } from '@/lib/observability-helper';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UserUpdateData {
  balance?: number;
  discount?: number;
  spinTickets?: number;
  role?: 'user' | 'admin';
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const VALID_ROLES = ['user', 'admin'] as const;
const RECENT_ITEMS_LIMIT = 10;
const MAX_BALANCE = 1_000_000_000; // 1 billion VND
const MAX_SPIN_TICKETS = 10_000;

const ERROR = {
  UNAUTHORIZED: 'Unauthorized',
  NOT_FOUND: 'User not found',
  GET_FAILED: 'Failed to get user',
  UPDATE_FAILED: 'Failed to update user',
  INVALID_BALANCE: 'Balance must be a valid integer between 0 and 1,000,000,000',
  INVALID_DISCOUNT: 'Discount must be an integer between 0 and 100',
  INVALID_SPIN_TICKETS: 'Spin tickets must be an integer between 0 and 10,000',
  INVALID_ROLE: 'Invalid role',
  PERMISSION_DENIED: 'Only super-admin can change user roles',
  INVALID_USER_ID: 'Invalid user ID format',
} as const;

// UUID v4 regex for path parameter validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Also accept CUID format (Prisma default)
const CUID_REGEX = /^c[a-z0-9]{24,}$/i;

const USER_DETAIL_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  balance: true,
  discount: true,
  spinTickets: true,
  referralCode: true,
  referredBy: true,
  createdAt: true,
} as const;

const ORDER_SELECT = {
  id: true,
  productName: true,
  amount: true,
  status: true,
  createdAt: true,
} as const;

const TRANSACTION_SELECT = {
  id: true,
  type: true,
  amount: true,
  description: true,
  status: true,
  createdAt: true,
} as const;

const USER_BASIC_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  balance: true,
  discount: true,
  spinTickets: true,
  createdAt: true,
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function isValidRole(role: unknown): role is 'user' | 'admin' {
  return typeof role === 'string' && VALID_ROLES.includes(role as 'user' | 'admin');
}

/**
 * Validate user ID path parameter
 * Accepts UUID v4 or CUID (Prisma default) formats
 */
function isValidUserId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // Limit length to prevent DoS with very long strings
  if (id.length > 50) return false;
  return UUID_REGEX.test(id) || CUID_REGEX.test(id);
}

/**
 * Validate and build update data with strict type and range checking
 */
function validateAndBuildUpdateData(
  body: Record<string, unknown>,
  session: { username: string }
): { valid: boolean; data?: UserUpdateData; error?: string } {
  const data: UserUpdateData = {};

  // Validate balance
  if (body.balance !== undefined) {
    const balance = Number(body.balance);
    if (!Number.isFinite(balance) || !Number.isInteger(balance)) {
      return { valid: false, error: ERROR.INVALID_BALANCE };
    }
    if (balance < 0 || balance > MAX_BALANCE) {
      return { valid: false, error: ERROR.INVALID_BALANCE };
    }
    data.balance = balance;
  }

  // Validate discount
  if (body.discount !== undefined) {
    const discount = Number(body.discount);
    if (!Number.isInteger(discount) || discount < 0 || discount > 100) {
      return { valid: false, error: ERROR.INVALID_DISCOUNT };
    }
    data.discount = discount;
  }

  // Validate spinTickets
  if (body.spinTickets !== undefined) {
    const tickets = Number(body.spinTickets);
    if (!Number.isInteger(tickets) || tickets < 0 || tickets > MAX_SPIN_TICKETS) {
      return { valid: false, error: ERROR.INVALID_SPIN_TICKETS };
    }
    data.spinTickets = tickets;
  }

  // Validate role (requires super-admin)
  if (body.role !== undefined) {
    if (!isValidRole(body.role)) {
      return { valid: false, error: ERROR.INVALID_ROLE };
    }
    // Only super-admin can change roles
    const superAdmin = process.env.ADMIN_USERNAME || 'admin';
    if (session.username !== superAdmin) {
      return { valid: false, error: ERROR.PERMISSION_DENIED };
    }
    data.role = body.role;
  }

  return { valid: true, data };
}

// ─── GET Handler ───────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateAdminSession(request);
    if (!session) {
      return errorResponse(ERROR.UNAUTHORIZED, 401);
    }

    const { id } = await params;

    // Validate path parameter to prevent injection attacks
    if (!isValidUserId(id)) {
      return errorResponse(ERROR.INVALID_USER_ID, 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_DETAIL_SELECT,
        orders: {
          take: RECENT_ITEMS_LIMIT,
          orderBy: { createdAt: 'desc' },
          select: ORDER_SELECT,
        },
        transactions: {
          take: RECENT_ITEMS_LIMIT,
          orderBy: { createdAt: 'desc' },
          select: TRANSACTION_SELECT,
        },
      },
    });

    if (!user) {
      return errorResponse(ERROR.NOT_FOUND, 404);
    }

    return NextResponse.json({ success: true, data: { user } });

  } catch (error) {
    logger.error('Get user error', error as Error, { action: 'get_user' });
    return errorResponse(ERROR.GET_FAILED, 500);
  }
}

// ─── PUT Handler ───────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateAdminSession(request);
    if (!session) {
      return errorResponse(ERROR.UNAUTHORIZED, 401);
    }

    const { id } = await params;

    // Validate path parameter to prevent injection attacks
    if (!isValidUserId(id)) {
      return errorResponse(ERROR.INVALID_USER_ID, 400);
    }
    const body = await request.json();
    
    // Validate all input data with proper type and range checking
    const validation = validateAndBuildUpdateData(body, session);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }
    
    const updateData = validation.data!;

    // Get current user state for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { balance: true, discount: true, spinTickets: true, role: true },
    });

    if (!currentUser) {
      return errorResponse(ERROR.NOT_FOUND, 404);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_BASIC_SELECT,
    });

    // Enhanced audit logging with before/after state
    logBusinessEvent('user_updated', {
      userId: id,
      updatedBy: session.username,
      before: {
        balance: currentUser.balance?.toString(),
        discount: currentUser.discount,
        spinTickets: currentUser.spinTickets,
        role: currentUser.role,
      },
      after: updateData,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: { user } });

  } catch (error) {
    logger.error('Update user error', error as Error, { action: 'update_user' });
    return errorResponse(ERROR.UPDATE_FAILED, 500);
  }
}
