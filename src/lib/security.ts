/**
 * Security utilities for ShopLienQuan
 * - Password validation with strength requirements
 * - CSRF token generation/validation
 * - Rate limiting (delegates to rate-limiter.ts)
 * - Input validation and sanitization
 */

import { loginRateLimiter } from './rate-limiter';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Legacy obfuscation key (kept for migration compatibility only)
const OBFUSCATION_KEY = 'tph2026xor';
const OBFUSCATION_PREFIX = '__obf__';

// ─── Legacy Obfuscation (DEPRECATED - Migration Only) ──────────────────────────

/** 
 * @deprecated XOR obfuscation is NOT secure. Kept only for migrating old data.
 * Do NOT use for new code. Data is stored server-side now.
 */
function xorWithKey(text: string, key: string): string {
  return text
    .split('')
    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join('');
}

/** 
 * @deprecated Used only for migrating old localStorage data to database.
 * Will be removed after migration is complete.
 */
export function deobfuscate(stored: string): string {
  if (!stored || !stored.startsWith(OBFUSCATION_PREFIX)) return stored;

  try {
    const b64 = stored.slice(OBFUSCATION_PREFIX.length);
    const xored = decodeURIComponent(escape(atob(b64)));
    return xorWithKey(xored, OBFUSCATION_KEY);
  } catch {
    return stored;
  }
}

// ─── CSRF Protection ───────────────────────────────────────────────────────────

interface CsrfTokenData {
  token: string;
  expiresAt: number;
}

// Server-side CSRF token store (in production, use Redis or database)
const csrfTokenStore = new Map<string, CsrfTokenData>();

/** Generate a cryptographically secure CSRF token */
export function generateCsrfToken(sessionId: string): string {
  // Generate random bytes
  const bytes = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Store with expiration
  csrfTokenStore.set(sessionId, {
    token,
    expiresAt: Date.now() + CSRF_TOKEN_EXPIRY_MS,
  });

  // Cleanup expired tokens periodically
  cleanupExpiredCsrfTokens();

  return token;
}

/** Validate a CSRF token for a session */
export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokenStore.get(sessionId);
  
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    csrfTokenStore.delete(sessionId);
    return false;
  }
  
  // Timing-safe comparison
  if (token.length !== stored.token.length) return false;
  
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ stored.token.charCodeAt(i);
  }
  
  return mismatch === 0;
}

/** Clear CSRF token after use (for one-time tokens) */
export function clearCsrfToken(sessionId: string): void {
  csrfTokenStore.delete(sessionId);
}

/** Cleanup expired CSRF tokens */
function cleanupExpiredCsrfTokens(): void {
  const now = Date.now();
  for (const [key, data] of csrfTokenStore.entries()) {
    if (now > data.expiresAt) {
      csrfTokenStore.delete(key);
    }
  }
}

/**
 * Validate CSRF token from request header
 * @param userId - The authenticated user's ID (used as session ID)
 * @param csrfToken - Token from X-CSRF-Token header
 * @returns Object with validation result and error message if failed
 */
export function validateCsrfFromRequest(
  userId: string,
  csrfToken: string | null
): { valid: boolean; error?: string } {
  if (!csrfToken) {
    return { valid: false, error: 'CSRF token is required' };
  }

  if (!validateCsrfToken(userId, csrfToken)) {
    return { valid: false, error: 'Invalid or expired CSRF token' };
  }

  return { valid: true };
}

// ─── Rate Limiting (delegates to server-side rate-limiter.ts) ──────────────────

export function checkLoginRateLimit(username: string): { allowed: boolean; remainingSeconds?: number } {
  const result = loginRateLimiter.check(username);
  return {
    allowed: result.allowed,
    remainingSeconds: result.resetIn,
  };
}

/** @deprecated Use checkLoginRateLimit instead */
export function checkRateLimit(username: string): boolean {
  const result = loginRateLimiter.check(username);
  if (!result.allowed) return false;
  loginRateLimiter.recordFailure(username);
  return true;
}

export function recordLoginFailure(username: string): void {
  loginRateLimiter.recordFailure(username);
}

export function clearLoginFailures(username: string): void {
  loginRateLimiter.clear(username);
}

// ─── Referral Code Generation ──────────────────────────────────────────────────

import { randomBytes } from 'crypto';

/** Generate cryptographically secure referral code from username */
export function generateReferralCode(username: string): string {
  const base = username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `${base}${random}`;
}

// ─── Input Sanitization ────────────────────────────────────────────────────────

const HTML_ESCAPE_MAP: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/** Strip dangerous HTML from user input */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>"'/]/g, char => HTML_ESCAPE_MAP[char] || char)
    .trim();
}

// ─── Input Validation ──────────────────────────────────────────────────────────

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 64;
const EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_MAX_LENGTH = 64;
const EMAIL_DOMAIN_MAX_LENGTH = 253;

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Validate username: alphanumeric + underscore, 3-20 chars */
export function validateUsername(username: string): string | null {
  if (!username || username.length < USERNAME_MIN_LENGTH) {
    return 'Tên đăng nhập tối thiểu 3 ký tự';
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return 'Tên đăng nhập tối đa 20 ký tự';
  }
  if (!USERNAME_REGEX.test(username)) {
    return 'Tên đăng nhập chỉ gồm chữ cái, số và dấu _';
  }
  return null;
}

/** Validate email format */
export function validateEmail(email: string): string | null {
  if (!email) return 'Email không được để trống';
  if (email.length > EMAIL_MAX_LENGTH) return 'Email quá dài (tối đa 254 ký tự)';
  if (!EMAIL_REGEX.test(email)) return 'Email không hợp lệ';

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return 'Email không hợp lệ';
  if (localPart.length > EMAIL_LOCAL_MAX_LENGTH) return 'Phần trước @ quá dài';
  if (domain.length > EMAIL_DOMAIN_MAX_LENGTH) return 'Tên miền quá dài';

  return null;
}

/**
 * Validate password
 * Requirements:
 * - Minimum 8 characters (industry standard)
 * - Maximum 64 characters (prevent DoS via bcrypt)
 * - Must contain at least one uppercase, lowercase, number, and special char
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Mật khẩu tối thiểu 8 ký tự';
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'Mật khẩu tối đa 64 ký tự';
  }
  
  // Require complexity for better security
  if (!/[a-z]/.test(password)) {
    return 'Mật khẩu phải chứa chữ thường';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Mật khẩu phải chứa chữ in hoa';
  }
  if (!/[0-9]/.test(password)) {
    return 'Mật khẩu phải chứa số';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Mật khẩu phải chứa ký tự đặc biệt (!@#$%^&*...)';
  }
  
  return null;
}

/**
 * Get password strength score (0-4)
 * 0: Very weak, 1: Weak, 2: Fair, 3: Strong, 4: Very strong
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score++;
  else suggestions.push('Tối thiểu 8 ký tự');

  if (password.length >= 12) score++;

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else suggestions.push('Thêm chữ in hoa và chữ thường');

  if (/[0-9]/.test(password)) score++;
  else suggestions.push('Thêm số');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  else suggestions.push('Thêm ký tự đặc biệt');

  // Penalize common patterns
  if (/^[0-9]+$/.test(password) || /^[a-zA-Z]+$/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push('Tránh dùng chỉ số hoặc chỉ chữ');
  }

  const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  
  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    suggestions: suggestions.slice(0, 3),
  };
}

// ─── Session Validation ────────────────────────────────────────────────────────

/** Check if stored session JSON is valid (basic tamper detection) */
export function validateUserSession(rawUser: string): boolean {
  try {
    const u = JSON.parse(rawUser);
    return !!(u && u.id && u.username && u.role && typeof u.balance === 'number');
  } catch {
    return false;
  }
}
