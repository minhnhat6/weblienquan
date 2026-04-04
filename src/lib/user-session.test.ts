/**
 * Tests for user-session.ts - HMAC-signed user session tokens
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createUserSessionToken,
  verifyUserSessionToken,
  USER_SESSION_COOKIE,
  getUserSessionCookieOptions,
  invalidateUserSessions,
  clearSessionInvalidation,
} from './user-session';

describe('user-session', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createUserSessionToken', () => {
    it('creates a valid signed token', async () => {
      const token = await createUserSessionToken('user-123', 'testuser');
      
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(2);
    });

    it('includes correct payload structure', async () => {
      const token = await createUserSessionToken('user-456', 'john_doe');
      const [payloadB64] = token.split('.');
      
      // Decode base64url payload
      const payloadJson = Buffer.from(payloadB64, 'base64url').toString();
      const payload = JSON.parse(payloadJson);
      
      expect(payload.sub).toBe('user-456');
      expect(payload.username).toBe('john_doe');
      expect(payload.role).toBe('user');
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(payload.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    });
  });

  describe('verifyUserSessionToken', () => {
    it('verifies a valid token', async () => {
      const token = await createUserSessionToken('user-789', 'alice');
      const payload = await verifyUserSessionToken(token);
      
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-789');
      expect(payload?.username).toBe('alice');
      expect(payload?.role).toBe('user');
    });

    it('rejects null/undefined tokens', async () => {
      expect(await verifyUserSessionToken(null)).toBeNull();
      expect(await verifyUserSessionToken(undefined)).toBeNull();
      expect(await verifyUserSessionToken('')).toBeNull();
    });

    it('rejects tampered tokens', async () => {
      const token = await createUserSessionToken('user-111', 'bob');
      const tampered = token.slice(0, -4) + 'xxxx';
      
      const payload = await verifyUserSessionToken(tampered);
      expect(payload).toBeNull();
    });

    it('rejects malformed tokens', async () => {
      expect(await verifyUserSessionToken('not.a.valid.token')).toBeNull();
      expect(await verifyUserSessionToken('single-part')).toBeNull();
      expect(await verifyUserSessionToken('invalid..signature')).toBeNull();
    });

    it('rejects expired tokens', async () => {
      // Create token and manually expire it
      const token = await createUserSessionToken('user-expired', 'expired_user');
      const [payloadB64, signature] = token.split('.');
      
      // Decode, modify expiration, re-encode (but signature won't match)
      const payloadJson = Buffer.from(payloadB64, 'base64url').toString();
      const payload = JSON.parse(payloadJson);
      payload.exp = Math.floor(Date.now() / 1000) - 3600; // Expired 1 hour ago
      
      const modifiedPayloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const modifiedToken = `${modifiedPayloadB64}.${signature}`;
      
      // Should reject due to signature mismatch (not expiration check)
      const result = await verifyUserSessionToken(modifiedToken);
      expect(result).toBeNull();
    });
  });

  describe('getUserSessionCookieOptions', () => {
    it('returns correct cookie options', () => {
      const options = getUserSessionCookieOptions();
      
      expect(options.name).toBe(USER_SESSION_COOKIE);
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('lax');
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(60 * 60 * 24 * 7); // 7 days
    });

    it('respects custom maxAge', () => {
      const options = getUserSessionCookieOptions(3600);
      expect(options.maxAge).toBe(3600);
    });
  });

  describe('USER_SESSION_COOKIE', () => {
    it('exports correct cookie name', () => {
      expect(USER_SESSION_COOKIE).toBe('slq_user_session');
    });
  });

  describe('production mode', () => {
    it('throws error when SESSION_SECRET is not set in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SESSION_SECRET;
      
      // Re-import to get fresh module with new env
      vi.resetModules();
      const { createUserSessionToken: createToken } = await import('./user-session');
      
      await expect(createToken('user-123', 'test')).rejects.toThrow(
        'SECURITY ERROR: SESSION_SECRET environment variable is required in production'
      );
    });

    it('works in production when SESSION_SECRET is set', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SESSION_SECRET = 'a-very-secure-secret-for-testing-purposes-32chars';
      
      vi.resetModules();
      const { createUserSessionToken: createToken, verifyUserSessionToken: verifyToken } = 
        await import('./user-session');
      
      const token = await createToken('user-prod', 'produser');
      const payload = await verifyToken(token);
      
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-prod');
    });
  });

  describe('session invalidation', () => {
    afterEach(() => {
      // Cleanup: clear any invalidation records created during tests
      clearSessionInvalidation('user-invalidate');
      clearSessionInvalidation('user-a');
      clearSessionInvalidation('user-b');
      clearSessionInvalidation('user-new-token');
    });

    it('invalidates all sessions for a user', async () => {
      // Create a token before invalidation
      const token = await createUserSessionToken('user-invalidate', 'testuser');
      
      // Verify it works initially
      let payload = await verifyUserSessionToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-invalidate');
      
      // Wait >1 second to ensure different timestamp (iat uses seconds precision)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Invalidate all sessions for this user
      invalidateUserSessions('user-invalidate');
      
      // Old token should now be rejected
      payload = await verifyUserSessionToken(token);
      expect(payload).toBeNull();
    });

    it('does not affect tokens from other users', async () => {
      const token1 = await createUserSessionToken('user-a', 'userA');
      const token2 = await createUserSessionToken('user-b', 'userB');
      
      // Wait >1 second for different timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Invalidate only user-a
      invalidateUserSessions('user-a');
      
      // user-a token should be rejected
      expect(await verifyUserSessionToken(token1)).toBeNull();
      
      // user-b token should still work
      const payload2 = await verifyUserSessionToken(token2);
      expect(payload2).not.toBeNull();
      expect(payload2?.sub).toBe('user-b');
    });

    it('allows new tokens after invalidation', async () => {
      // Invalidate all sessions
      invalidateUserSessions('user-new-token');
      
      // Wait >1 second for different timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Create a new token after invalidation
      const newToken = await createUserSessionToken('user-new-token', 'testuser');
      
      // New token should work since iat > invalidation time
      const payload = await verifyUserSessionToken(newToken);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-new-token');
    });
  });
});
