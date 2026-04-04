/**
 * CSP Nonce generation utilities for secure inline scripts
 * Used to remove 'unsafe-inline' from Content-Security-Policy
 */

import { randomBytes } from 'crypto';
import { headers } from 'next/headers';

// ─── Nonce Generation ──────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure nonce for CSP
 * Returns a base64-encoded random string
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * Get the CSP nonce from request headers (server components)
 * The nonce is set by middleware and passed via headers
 */
export async function getNonce(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get('x-nonce') ?? undefined;
}

// ─── CSP Directives ────────────────────────────────────────────────────────────

/**
 * Build CSP header with nonce for inline scripts
 * @param nonce - The nonce to use for script-src
 * @param isDev - Whether in development mode (allows more permissive CSP)
 */
export function buildCSPHeader(nonce: string, isDev = false): string {
  // Development mode needs more permissive CSP for hot reload
  if (isDev) {
    return [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss: https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }

  // Production: Strict CSP with nonce-based script-src
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline for styles
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

/**
 * CSP header for report-only mode (for testing)
 */
export function buildCSPReportOnlyHeader(nonce: string, reportUri?: string): string {
  const csp = buildCSPHeader(nonce, false);
  return reportUri ? `${csp}; report-uri ${reportUri}` : csp;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CSPConfig {
  nonce: string;
  isDev: boolean;
  reportOnly?: boolean;
  reportUri?: string;
}
