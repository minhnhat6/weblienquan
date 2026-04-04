/**
 * Orders API - Create and List Orders
 * Uses ACID transactions for balance + product purchase
 * Security: Validates HMAC-signed session token + rate limiting + CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logBusinessEvent } from '@/lib/observability-helper';
import { USER_SESSION_COOKIE, verifyUserSessionToken } from '@/lib/user-session';
import { orderRateLimiter } from '@/lib/rate-limiter';
import { validateCsrfFromRequest } from '@/lib/security';
import { logger } from '@/lib/logger';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_PAGE = 10000;
const MAX_LIMIT = 100;

// ─── Error Messages ────────────────────────────────────────────────────────────

const ERROR = {
  NOT_AUTHENTICATED: 'Not authenticated',
  RATE_LIMITED: 'Too many order requests. Please try again later.',
  CSRF_INVALID: 'Invalid or missing CSRF token',
  PRODUCT_ID_REQUIRED: 'Product ID is required',
  PRODUCT_NOT_FOUND: 'Product not found',
  USER_NOT_FOUND: 'User not found',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  OUT_OF_STOCK: 'Product out of stock',
  GET_ORDERS_FAILED: 'Failed to get orders',
  CREATE_ORDER_FAILED: 'Failed to create order',
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function getUserIdFromCookie(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  
  const payload = await verifyUserSessionToken(token);
  return payload?.sub ?? null;
}

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(error: string, status: number) {
  return jsonResponse({ success: false, error }, status);
}

function getPaginationParams(url: string) {
  const { searchParams } = new URL(url);
  const rawPage = parseInt(searchParams.get('page') || String(DEFAULT_PAGE));
  const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
  
  // Clamp values to prevent DoS via excessive pagination
  const page = Math.min(Math.max(1, isNaN(rawPage) ? DEFAULT_PAGE : rawPage), MAX_PAGE);
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit), MAX_LIMIT);
  
  return { page, limit, skip: (page - 1) * limit };
}

// ─── GET /api/orders ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromCookie(request);
    if (!userId) {
      return errorResponse(ERROR.NOT_AUTHENTICATED, 401);
    }

    const { page, limit, skip } = getPaginationParams(request.url);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: { select: { name: true, image: true } }
        }
      }),
      prisma.order.count({ where: { userId } })
    ]);

    return jsonResponse({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get orders error', error as Error, { action: 'get_orders' });
    return errorResponse(ERROR.GET_ORDERS_FAILED, 500);
  }
}

// ─── POST /api/orders ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromCookie(request);
    if (!userId) {
      return errorResponse(ERROR.NOT_AUTHENTICATED, 401);
    }

    // Validate CSRF token
    const csrfToken = request.headers.get('X-CSRF-Token');
    const csrfValidation = validateCsrfFromRequest(userId, csrfToken);
    if (!csrfValidation.valid) {
      return errorResponse(ERROR.CSRF_INVALID, 403);
    }

    // Rate limit by user ID to prevent order spam
    const rateLimit = orderRateLimiter.check(`order:${userId}`);
    if (!rateLimit.allowed) {
      return errorResponse(ERROR.RATE_LIMITED, 429);
    }

    const { productId } = await request.json();
    if (!productId) {
      return errorResponse(ERROR.PRODUCT_ID_REQUIRED, 400);
    }

    const productIdNum = Number(productId);
    if (isNaN(productIdNum)) {
      return errorResponse(ERROR.PRODUCT_ID_REQUIRED, 400);
    }

    // Record attempt before processing
    orderRateLimiter.recordFailure(`order:${userId}`);

    const result = await executeOrderTransaction(userId, productIdNum);

    logBusinessEvent('order_created', {
      orderId: result.order.id,
      userId,
      productId: productIdNum,
      amount: Number(result.product.price)
    });

    return jsonResponse({ success: true, data: { order: result.order } });

  } catch (error) {
    logger.error('Create order error', error as Error, { action: 'create_order' });
    return handleOrderError(error);
  }
}

// ─── Transaction Logic ─────────────────────────────────────────────────────────

async function executeOrderTransaction(userId: string, productId: number) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error(ERROR.PRODUCT_NOT_FOUND);

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(ERROR.USER_NOT_FOUND);

    const price = Number(product.price);
    if (Number(user.balance) < price) {
      throw new Error(ERROR.INSUFFICIENT_BALANCE);
    }

    const availableAccount = await tx.accountStock.findFirst({
      where: { productId, isSold: false }
    });
    if (!availableAccount) throw new Error(ERROR.OUT_OF_STOCK);

    const order = await tx.order.create({
      data: {
        userId,
        productId,
        productName: product.name,
        accountData: availableAccount.accountData,
        amount: product.price,
        status: 'success'
      }
    });

    await tx.accountStock.update({
      where: { id: availableAccount.id },
      data: { isSold: true, soldAt: new Date(), orderId: order.id }
    });

    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: price } }
    });

    await tx.transaction.create({
      data: {
        userId,
        type: 'purchase',
        amount: product.price,
        description: `Purchased ${product.name}`,
        status: 'success'
      }
    });

    await tx.product.update({
      where: { id: productId },
      data: { soldCount: { increment: 1 }, totalStock: { decrement: 1 } }
    });

    return { order, product };
  });
}

function handleOrderError(error: unknown) {
  if (error instanceof Error) {
    const statusMap: Record<string, number> = {
      [ERROR.INSUFFICIENT_BALANCE]: 400,
      [ERROR.OUT_OF_STOCK]: 400,
      [ERROR.PRODUCT_NOT_FOUND]: 404,
    };
    const status = statusMap[error.message];
    if (status) {
      return errorResponse(error.message, status);
    }
  }
  return errorResponse(ERROR.CREATE_ORDER_FAILED, 500);
}
