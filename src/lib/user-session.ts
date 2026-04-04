/**
 * Server-side user session management
 * HMAC-signed tokens compatible with Edge Runtime (Web Crypto API)
 * 
 * Security Fix: Replaces plain userId cookie with signed tokens
 * to prevent session hijacking via cookie tampering.
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

export const USER_SESSION_COOKIE = 'slq_user_session';
const DEFAULT_SECRET = 'dev-only-session-secret-change-me';
const SESSION_DURATION_DAYS = 7;
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * SESSION_DURATION_DAYS;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserSessionPayload {
  sub: string;        // User ID
  username: string;   // Username for logging
  role: 'user';       // Always 'user' for user sessions
  exp: number;        // Expiration timestamp (seconds)
  iat: number;        // Issued at timestamp (seconds)
}

// ─── Session Invalidation Store ────────────────────────────────────────────────
// Tracks when user sessions were invalidated (e.g., password change)
// Sessions issued before this timestamp are rejected

const sessionInvalidationStore = new Map<string, number>();

/**
 * Invalidate all sessions for a user (call after password change)
 * All tokens issued before this timestamp will be rejected
 */
export function invalidateUserSessions(userId: string): void {
  sessionInvalidationStore.set(userId, Math.floor(Date.now() / 1000));
}

/**
 * Check if a token was issued before the user's sessions were invalidated
 */
function isTokenInvalidated(userId: string, issuedAt: number): boolean {
  const invalidatedAt = sessionInvalidationStore.get(userId);
  if (!invalidatedAt) return false;
  return issuedAt < invalidatedAt;
}

/**
 * Clear invalidation record for a user (optional cleanup)
 */
export function clearSessionInvalidation(userId: string): void {
  sessionInvalidationStore.delete(userId);
}

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

/** Create a signed user session token */
export async function createUserSessionToken(
  userId: string,
  username: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const payload: UserSessionPayload = {
    sub: userId,
    username,
    role: 'user',
    exp: now + SESSION_DURATION_SECONDS,
    iat: now,
  };

  const payloadEncoded = toBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const signature = await signWithHmac(payloadEncoded, getSecret());

  return `${payloadEncoded}.${signature}`;
}

// ─── Token Verification ────────────────────────────────────────────────────────

/** Verify and decode a user session token */
export async function verifyUserSessionToken(
  token: string | undefined | null
): Promise<UserSessionPayload | null> {
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
    const payload = JSON.parse(payloadRaw) as UserSessionPayload;

    // Validate required fields
    if (payload.role !== 'user') return null;
    if (payload.exp * 1000 < Date.now()) return null;
    if (!payload.sub || !payload.username) return null;

    // Check if session was invalidated (e.g., after password change)
    if (isTokenInvalidated(payload.sub, payload.iat)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ─── Cookie Helpers ────────────────────────────────────────────────────────────

/** Get cookie options for user session */
export function getUserSessionCookieOptions(maxAge: number = SESSION_DURATION_SECONDS) {
  return {
    name: USER_SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

/** Extract user session token from cookie header */
export function extractUserSessionToken(cookieHeader: string): string {
  const sessionCookie = cookieHeader
    .split(';')
    .map(v => v.trim())
    .find(v => v.startsWith(`${USER_SESSION_COOKIE}=`));

  if (!sessionCookie) return '';
  return decodeURIComponent(sessionCookie.split('=').slice(1).join('='));
}

// ─── Request Helpers ───────────────────────────────────────────────────────────

/** Extract and validate user session from request cookies (for API routes) */
export async function validateUserSession(
  cookieValue: string | undefined
): Promise<{ userId: string; username: string } | null> {
  if (!cookieValue) return null;

  const payload = await verifyUserSessionToken(cookieValue);
  if (!payload) return null;

  return { userId: payload.sub, username: payload.username };
}
