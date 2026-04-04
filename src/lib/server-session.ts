/**
 * Server-side admin session management
 * HMAC-signed tokens compatible with Edge Runtime (Web Crypto API)
 */

import type { AdminSessionPayload } from './types';

// ─── Constants ─────────────────────────────────────────────────────────────────

export const ADMIN_SESSION_COOKIE = 'slq_admin_session';
const DEFAULT_SECRET = 'dev-only-session-secret-change-me';

// ─── Internal Helpers ──────────────────────────────────────────────────────────

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  
  // Enforce SESSION_SECRET in production
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error(
      'SECURITY ERROR: SESSION_SECRET environment variable is required in production. ' +
      'Generate a secure random string (min 32 characters) and set it in your environment.'
    );
  }
  
  return secret || DEFAULT_SECRET;
}

/** Convert Uint8Array to base64url string */
function toBase64Url(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  return Buffer.from(bytes).toString('base64url');
}

/** Convert base64url string to Uint8Array */
function fromBase64Url(value: string): Uint8Array {
  if (typeof atob === 'function') {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  }
  return Uint8Array.from(Buffer.from(value, 'base64url'));
}

/** Sign input string with HMAC-SHA256 */
async function signWithHmac(input: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(input)
  );

  return toBase64Url(new Uint8Array(signature));
}

/** Timing-safe comparison of two byte arrays */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }

  return mismatch === 0;
}

// ─── Token Creation ────────────────────────────────────────────────────────────

/** Create a signed admin session token */
export async function createAdminSessionToken(
  payload: Omit<AdminSessionPayload, 'role'>
): Promise<string> {
  const fullPayload: AdminSessionPayload = {
    ...payload,
    role: 'admin',
  };

  const payloadEncoded = toBase64Url(
    new TextEncoder().encode(JSON.stringify(fullPayload))
  );
  const signature = await signWithHmac(payloadEncoded, getSecret());

  return `${payloadEncoded}.${signature}`;
}

// ─── Token Verification ────────────────────────────────────────────────────────

/** Verify and decode an admin session token */
export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token) return null;

  const [payloadEncoded, signature] = token.split('.');
  if (!payloadEncoded || !signature) return null;

  // Verify signature
  const expectedSignature = await signWithHmac(payloadEncoded, getSecret());

  let actual: Uint8Array;
  let expected: Uint8Array;
  try {
    actual = fromBase64Url(signature);
    expected = fromBase64Url(expectedSignature);
  } catch {
    return null;
  }

  if (!timingSafeEqual(actual, expected)) return null;

  // Decode and validate payload
  try {
    const payloadRaw = new TextDecoder().decode(fromBase64Url(payloadEncoded));
    const payload = JSON.parse(payloadRaw) as AdminSessionPayload;

    if (payload.role !== 'admin') return null;
    if (payload.exp * 1000 < Date.now()) return null;
    if (!payload.sub || !payload.username) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── Request Helpers ───────────────────────────────────────────────────────────

/** Extract and validate admin session from request cookies */
export async function validateAdminSession(
  request: Request
): Promise<{ username: string } | null> {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;

  const match = cookies.match(/slq_admin_session=([^;]+)/);
  if (!match) return null;

  const payload = await verifyAdminSessionToken(match[1]);
  if (!payload) return null;

  return { username: payload.username };
}
