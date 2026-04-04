import { logger } from '@/lib/logger';
/**
 * Admin Recharge Approval/Rejection API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminSession } from '@/lib/server-session';
import { logBusinessEvent } from '@/lib/observability-helper';

// ─── Types ─────────────────────────────────────────────────────────────────────

type RechargeAction = 'approve' | 'reject';

// ─── Constants ─────────────────────────────────────────────────────────────────

const VALID_ACTIONS: RechargeAction[] = ['approve', 'reject'];

// UUID v4 regex for path parameter validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Also accept CUID format (Prisma default)
const CUID_REGEX = /^c[a-z0-9]{24,}$/i;

const ERROR = {
  UNAUTHORIZED: 'Unauthorized',
  INVALID_ACTION: 'Invalid action',
  NOT_FOUND: 'Recharge request not found',
  ALREADY_PROCESSED: 'Recharge request already processed',
  PROCESS_FAILED: 'Failed to process recharge request',
  INVALID_ID: 'Invalid recharge request ID format',
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function isValidAction(action: unknown): action is RechargeAction {
  return typeof action === 'string' && VALID_ACTIONS.includes(action as RechargeAction);
}

/**
 * Validate recharge ID path parameter
 */
function isValidRechargeId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  if (id.length > 50) return false;
  return UUID_REGEX.test(id) || CUID_REGEX.test(id);
}

async function approveRecharge(
  id: string,
  recharge: { userId: string; amount: number; paymentMethod: string },
  reviewerUsername: string
) {
  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: recharge.userId },
      data: { balance: { increment: recharge.amount } },
    });

    await tx.transaction.create({
      data: {
        userId: recharge.userId,
        type: 'recharge',
        amount: recharge.amount,
        description: `Recharge approved - ${recharge.paymentMethod}`,
        status: 'success',
      },
    });

    return tx.rechargeRequest.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedBy: reviewerUsername,
        reviewedAt: new Date(),
      },
    });
  });
}

async function rejectRecharge(
  id: string,
  reviewerUsername: string,
  rejectionNote?: string
) {
  return prisma.rechargeRequest.update({
    where: { id },
    data: {
      status: 'rejected',
      reviewedBy: reviewerUsername,
      reviewedAt: new Date(),
      rejectionNote: rejectionNote || null,
    },
  });
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
    if (!isValidRechargeId(id)) {
      return errorResponse(ERROR.INVALID_ID, 400);
    }

    const { action, rejectionNote } = await request.json();

    if (!isValidAction(action)) {
      return errorResponse(ERROR.INVALID_ACTION, 400);
    }

    const recharge = await prisma.rechargeRequest.findUnique({ where: { id } });

    if (!recharge) {
      return errorResponse(ERROR.NOT_FOUND, 404);
    }

    if (recharge.status !== 'pending') {
      return errorResponse(ERROR.ALREADY_PROCESSED, 400);
    }

    let result;

    if (action === 'approve') {
      result = await approveRecharge(
        id,
        {
          userId: recharge.userId,
          amount: Number(recharge.amount),
          paymentMethod: recharge.paymentMethod,
        },
        session.username
      );

      logBusinessEvent('recharge_approved', {
        rechargeId: id,
        userId: recharge.userId,
        amount: Number(recharge.amount),
        reviewedBy: session.username,
      });
    } else {
      result = await rejectRecharge(id, session.username, rejectionNote);

      logBusinessEvent('recharge_rejected', {
        rechargeId: id,
        userId: recharge.userId,
        reviewedBy: session.username,
        reason: rejectionNote,
      });
    }

    return NextResponse.json({ success: true, data: { recharge: result } });

  } catch (error) {
    logger.error('Process recharge error', error as Error, { action: 'process_recharge' });
    return errorResponse(ERROR.PROCESS_FAILED, 500);
  }
}
