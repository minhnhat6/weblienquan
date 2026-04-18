import { describe, expect, it } from 'vitest';
import { 
  sanitizeInput, 
  validatePassword, 
  getPasswordStrength,
  generateCsrfToken,
  validateCsrfToken,
  clearCsrfToken 
} from '@/lib/security';

// NOTE: Client-side rate limiting tests removed (deprecated)
// Server-side rate limiting is now tested in rate-limiter.test.ts

describe('sanitizeInput', () => {
  it('sanitizes dangerous HTML chars', () => {
    const raw = `<script>alert('xss')</script>`;
    const safe = sanitizeInput(raw);
    expect(safe).not.toContain('<script>');
    expect(safe).toContain('&lt;script&gt;');
  });
});

describe('validatePassword', () => {
  it('rejects passwords shorter than 6 characters', () => {
    expect(validatePassword('abc12')).toBe('Mật khẩu tối thiểu 6 ký tự');
  });

  it('accepts passwords with 6+ characters', () => {
    expect(validatePassword('abcdef')).toBeNull();
    expect(validatePassword('123456')).toBeNull();
    expect(validatePassword('abcDEF')).toBeNull();
  });

  it('rejects passwords longer than 64 characters', () => {
    const longPassword = 'A'.repeat(60) + 'a1!x';
    expect(validatePassword(longPassword + 'extra')).toBe('Mật khẩu tối đa 64 ký tự');
  });
});

describe('getPasswordStrength', () => {
  it('returns very weak for short passwords', () => {
    const result = getPasswordStrength('abc');
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.label).toBe('Rất yếu');
  });

  it('returns strong for good passwords', () => {
    const result = getPasswordStrength('MyP@ssw0rd');
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it('provides helpful suggestions', () => {
    const result = getPasswordStrength('weak');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('returns very strong for excellent passwords', () => {
    const result = getPasswordStrength('MyV3ryStr0ng!P@ss');
    expect(result.score).toBe(4);
    expect(result.label).toBe('Rất mạnh');
  });
});

describe('CSRF Protection', () => {
  it('generates unique tokens', () => {
    const token1 = generateCsrfToken('session-1');
    const token2 = generateCsrfToken('session-2');
    
    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
  });

  it('validates correct tokens', () => {
    const sessionId = 'test-session';
    const token = generateCsrfToken(sessionId);
    
    expect(validateCsrfToken(sessionId, token)).toBe(true);
  });

  it('rejects invalid tokens', () => {
    const sessionId = 'test-session-2';
    generateCsrfToken(sessionId);
    
    expect(validateCsrfToken(sessionId, 'wrong-token')).toBe(false);
    expect(validateCsrfToken(sessionId, '')).toBe(false);
  });

  it('rejects tokens for unknown sessions', () => {
    expect(validateCsrfToken('unknown-session', 'any-token')).toBe(false);
  });

  it('clears tokens properly', () => {
    const sessionId = 'session-to-clear';
    const token = generateCsrfToken(sessionId);
    
    expect(validateCsrfToken(sessionId, token)).toBe(true);
    
    clearCsrfToken(sessionId);
    
    expect(validateCsrfToken(sessionId, token)).toBe(false);
  });
});

import { validateCsrfFromRequest } from '@/lib/security';

describe('validateCsrfFromRequest', () => {
  it('returns error when token is null', () => {
    const result = validateCsrfFromRequest('user-123', null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('CSRF token is required');
  });

  it('returns error when token is invalid', () => {
    generateCsrfToken('user-456');
    const result = validateCsrfFromRequest('user-456', 'wrong-token');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid or expired CSRF token');
  });

  it('returns valid for correct token', () => {
    const token = generateCsrfToken('user-789');
    const result = validateCsrfFromRequest('user-789', token);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
