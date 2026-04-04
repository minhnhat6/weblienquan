import { logger } from '@/lib/logger';
/**
 * Recharge API - User creates recharge requests
 * Security: Validates HMAC-signed session token + rate limiting + CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logBusinessEvent } from '@/lib/observability-helper';
import { sanitizeInput, validateCsrfFromRequest } from '@/lib/security';
import { USER_SESSION_COOKIE, verifyUserSessionToken } from '@/lib/user-session';
import { rechargeRateLimiter } from '@/lib/rate-limiter';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MIN_RECHARGE_AMOUNT = 10000;
const MAX_RECHARGE_AMOUNT = 100_000_000; // 100M VND
const DEFAULT_RECHARGE_LIMIT = 50;

const ERROR = {
  NOT_AUTHENTICATED: 'Not authenticated',
  RATE_LIMITED: 'Too many recharge requests. Please try again later.',
  CSRF_INVALID: 'Invalid or missing CSRF token',
  MISSING_FIELDS: 'Amount and payment method are required',
  AMOUNT_TOO_LOW: `Minimum recharge amount is ${MIN_RECHARGE_AMOUNT.toLocaleString()} VND`,
  AMOUNT_TOO_HIGH: `Maximum recharge amount is ${MAX_RECHARGE_AMOUNT.toLocaleString()} VND`,
  AMOUNT_INVALID: 'Amount must be a valid positive integer',
  INVALID_URL: 'Receipt URL must be a valid HTTPS URL',
  GET_FAILED: 'Failed to get recharge requests',
  CREATE_FAILED: 'Failed to create recharge request',
} as const;

// ─── Validation Helpers ────────────────────────────────────────────────────────

function validateRechargeAmount(amount: unknown): { valid: boolean; error?: string } {
  if (typeof amount !== 'number') {
    return { valid: false, error: ERROR.AMOUNT_INVALID };
  }
  
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return { valid: false, error: ERROR.AMOUNT_INVALID };
  }
  
  if (amount < MIN_RECHARGE_AMOUNT) {
    return { valid: false, error: ERROR.AMOUNT_TOO_LOW };
  }
  
  if (amount > MAX_RECHARGE_AMOUNT) {
    return { valid: false, error: ERROR.AMOUNT_TOO_HIGH };
  }
  
  return { valid: true };
}

function validateReceiptUrl(url: unknown): { valid: boolean; error?: string } {
  if (url === null || url === undefined || url === '') {
    return { valid: true }; // Optional field
  }
  
  if (typeof url !== 'string') {
    return { valid: false, error: ERROR.INVALID_URL };
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: ERROR.INVALID_URL };
    }
    
    const hostname = parsed.hostname.toLowerCase();
    
    // Block localhost and loopback addresses
    const blockedPatterns = [
      'localhost', '127.0.0.1', '0.0.0.0',
      '169.254.169.254', // AWS/cloud metadata
      '::1', '[::1]', '[::]', '0:0:0:0:0:0:0:1',
    ];
    
    if (blockedPatterns.some(p => hostname === p || hostname.includes(p))) {
      logger.warn('SSRF attempt blocked', { metadata: { hostname, type: 'blocked_pattern' } });
      return { valid: false, error: ERROR.INVALID_URL };
    }
    
    // Block private IPv4 ranges (RFC 1918)
    const privateIPv4Regex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;
    if (privateIPv4Regex.test(hostname)) {
      logger.warn('SSRF attempt blocked', { metadata: { hostname, type: 'private_ipv4' } });
      return { valid: false, error: ERROR.INVALID_URL };
    }
    
    // Block IPv6 private/local ranges (more comprehensive check)
    const ipv6Patterns = [
      /^fe80:/i,       // Link-local
      /^fc00:/i,       // Unique local
      /^fd[0-9a-f]{2}:/i, // Unique local
      /^::ffff:/i,     // IPv4-mapped IPv6
      /^\[fe80:/i,     // Bracketed link-local
      /^\[fc00:/i,     // Bracketed unique local
      /^\[fd[0-9a-f]{2}:/i, // Bracketed unique local
    ];
    
    if (ipv6Patterns.some(pattern => pattern.test(hostname))) {
      logger.warn('SSRF attempt blocked', { metadata: { hostname, type: 'private_ipv6' } });
      return { valid: false, error: ERROR.INVALID_URL };
    }
    
    // Block numeric IPv4 addresses to prevent decimal/octal encoding bypasses
    // Only allow hostnames that look like domain names
    const isNumericIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const isIPv6 = hostname.includes(':') || hostname.startsWith('[');
    
    if (isNumericIP || isIPv6) {
      // For IPs, we've already blocked private ranges above
      // But disallow direct IP access to reduce attack surface
      logger.warn('Direct IP access blocked', { metadata: { hostname, type: 'direct_ip' } });
      return { valid: false, error: ERROR.INVALID_URL };
    }
    
    // Max URL length
    if (url.length > 2048) {
      return { valid: false, error: ERROR.INVALID_URL };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: ERROR.INVALID_URL };
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  
  const payload = await verifyUserSessionToken(token);
  return payload?.sub ?? null;
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// ─── GET /api/recharge ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return errorResponse(ERROR.NOT_AUTHENTICATED, 401);
    }

    const recharges = await prisma.rechargeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: DEFAULT_RECHARGE_LIMIT,
    });

    return NextResponse.json({ success: true, data: { recharges } });

  } catch (error) {
    logger.error('Get recharges error', error as Error, { action: 'get_recharges' });
    return errorResponse(ERROR.GET_FAILED, 500);
  }
}

// ─── POST /api/recharge ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return errorResponse(ERROR.NOT_AUTHENTICATED, 401);
    }

    // Validate CSRF token
    const csrfToken = request.headers.get('X-CSRF-Token');
    const csrfValidation = validateCsrfFromRequest(userId, csrfToken);
    if (!csrfValidation.valid) {
      return errorResponse(ERROR.CSRF_INVALID, 403);
    }

    // Rate limit by user ID to prevent recharge spam
    const rateLimit = rechargeRateLimiter.check(`recharge:${userId}`);
    if (!rateLimit.allowed) {
      return errorResponse(ERROR.RATE_LIMITED, 429);
    }

    const body = await request.json();
    const { amount, paymentMethod, receiptUrl } = body;

    if (amount === undefined || !paymentMethod) {
      return errorResponse(ERROR.MISSING_FIELDS, 400);
    }

    // Validate amount (type, range, integer)
    const amountValidation = validateRechargeAmount(amount);
    if (!amountValidation.valid) {
      return errorResponse(amountValidation.error!, 400);
    }

    // Validate receipt URL (SSRF protection)
    const urlValidation = validateReceiptUrl(receiptUrl);
    if (!urlValidation.valid) {
      return errorResponse(urlValidation.error!, 400);
    }

    // Record attempt after all validation passes
    rechargeRateLimiter.recordFailure(`recharge:${userId}`);

    const recharge = await prisma.rechargeRequest.create({
      data: {
        userId,
        amount,
        paymentMethod: sanitizeInput(paymentMethod),
        receiptUrl: receiptUrl ? sanitizeInput(receiptUrl) : null,
        status: 'pending',
      },
    });

    logBusinessEvent('recharge_requested', {
      rechargeId: recharge.id,
      userId,
      amount: Number(amount),
    });

    return NextResponse.json({ success: true, data: { recharge } });

  } catch (error) {
    logger.error('Create recharge error', error as Error, { action: 'create_recharge' });
    return errorResponse(ERROR.CREATE_FAILED, 500);
  }
}
