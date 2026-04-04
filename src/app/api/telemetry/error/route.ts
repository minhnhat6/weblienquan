/**
 * Telemetry Error API - Collects client-side errors for debugging
 * Security: Rate limited to prevent log spam
 */

import { NextRequest, NextResponse } from 'next/server';
import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { telemetryRateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ErrorPayload {
  type?: string;
  message?: string;
  stack?: string;
  route?: string;
  meta?: Record<string, unknown>;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LOGS_DIR = '.runtime-logs';
const ERROR_LOG_FILE = 'client-errors.log';
const MAX_MESSAGE_LENGTH = 2000;
const MAX_STACK_LENGTH = 5000;
const MAX_REQUEST_BODY_SIZE = 16 * 1024; // 16KB max request body

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

function sanitizePayload(body: ErrorPayload): ErrorPayload {
  return {
    type: body.type?.slice(0, 100) || 'unknown',
    message: body.message?.slice(0, MAX_MESSAGE_LENGTH) || 'unknown error',
    stack: body.stack?.slice(0, MAX_STACK_LENGTH) || undefined,
    route: body.route?.slice(0, 200) || undefined,
    meta: body.meta ? sanitizeMeta(body.meta) : undefined,
  };
}

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const keys = Object.keys(meta).slice(0, 20); // Limit number of keys
  
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === 'string') {
      sanitized[key] = value.slice(0, 500);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

function formatLogEntry(body: ErrorPayload): string {
  return JSON.stringify({
    ts: new Date().toISOString(),
    type: body.type,
    message: body.message,
    stack: body.stack,
    route: body.route,
    meta: body.meta,
  });
}

// ─── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP to prevent log spam/DoS
    const clientIp = getClientIp(request);
    const rateLimit = telemetryRateLimiter.check(`telemetry:${clientIp}`);
    
    if (!rateLimit.allowed) {
      logger.warn('Telemetry rate limit exceeded', { 
        metadata: { ip: clientIp },
        action: 'telemetry_rate_limited'
      });
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Check request body size to prevent DoS
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_REQUEST_BODY_SIZE) {
      logger.warn('Telemetry request too large', {
        metadata: { ip: clientIp, size: contentLength },
        action: 'telemetry_payload_too_large'
      });
      return NextResponse.json(
        { success: false, error: 'Request body too large' },
        { status: 413 }
      );
    }

    const body = (await request.json()) as ErrorPayload;
    const sanitizedBody = sanitizePayload(body);
    const logsDir = join(process.cwd(), LOGS_DIR);

    await mkdir(logsDir, { recursive: true });
    await appendFile(join(logsDir, ERROR_LOG_FILE), `${formatLogEntry(sanitizedBody)}\n`, 'utf8');

    return NextResponse.json({ success: true });

  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to store telemetry event' },
      { status: 500 }
    );
  }
}
