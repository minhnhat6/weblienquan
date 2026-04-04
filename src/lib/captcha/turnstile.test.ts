import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Cloudflare Turnstile', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    vi.resetModules();
  });

  describe('isCaptchaEnabled', () => {
    it('returns false when TURNSTILE_SECRET_KEY not set', async () => {
      delete process.env.TURNSTILE_SECRET_KEY;
      vi.resetModules();
      const { isCaptchaEnabled } = await import('./turnstile');
      expect(isCaptchaEnabled()).toBe(false);
    });

    it('returns true when TURNSTILE_SECRET_KEY is set', async () => {
      process.env.TURNSTILE_SECRET_KEY = 'test-secret';
      vi.resetModules();
      const { isCaptchaEnabled } = await import('./turnstile');
      expect(isCaptchaEnabled()).toBe(true);
    });
  });

  describe('verifyCaptcha', () => {
    it('bypasses verification in dev mode when secret not set', async () => {
      delete process.env.TURNSTILE_SECRET_KEY;
      process.env.NODE_ENV = 'development';
      vi.resetModules();
      const { verifyCaptcha } = await import('./turnstile');

      const result = await verifyCaptcha('any-token');
      expect(result.success).toBe(true);
    });

    it('returns error when token is null and captcha is enabled', async () => {
      process.env.TURNSTILE_SECRET_KEY = 'test-secret';
      vi.resetModules();
      const { verifyCaptcha } = await import('./turnstile');

      const result = await verifyCaptcha(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Captcha token is required');
    });

    it('returns error when token is empty string', async () => {
      process.env.TURNSTILE_SECRET_KEY = 'test-secret';
      vi.resetModules();
      const { verifyCaptcha } = await import('./turnstile');

      const result = await verifyCaptcha('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Captcha token is required');
    });

    it('returns success for valid token', async () => {
      process.env.TURNSTILE_SECRET_KEY = 'test-secret';
      
      // Mock fetch before importing module
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      
      vi.resetModules();
      const { verifyCaptcha } = await import('./turnstile');

      const result = await verifyCaptcha('valid-token');
      expect(result.success).toBe(true);
    });

    it('returns error for invalid token', async () => {
      process.env.TURNSTILE_SECRET_KEY = 'test-secret';
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: false, 
          'error-codes': ['invalid-input-response'] 
        }),
      });
      
      vi.resetModules();
      const { verifyCaptcha } = await import('./turnstile');

      const result = await verifyCaptcha('invalid-token');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Captcha response is invalid');
    });

    it('returns error when API is unavailable', async () => {
      process.env.TURNSTILE_SECRET_KEY = 'test-secret';
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      
      vi.resetModules();
      const { verifyCaptcha } = await import('./turnstile');

      const result = await verifyCaptcha('some-token');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Captcha verification service unavailable');
    });

    it('returns error on network failure', async () => {
      process.env.TURNSTILE_SECRET_KEY = 'test-secret';
      
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
      
      vi.resetModules();
      const { verifyCaptcha } = await import('./turnstile');

      const result = await verifyCaptcha('some-token');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Captcha verification failed');
    });

    it('maps timeout error correctly', async () => {
      process.env.TURNSTILE_SECRET_KEY = 'test-secret';
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: false, 
          'error-codes': ['timeout-or-duplicate'] 
        }),
      });
      
      vi.resetModules();
      const { verifyCaptcha } = await import('./turnstile');

      const result = await verifyCaptcha('expired-token');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Captcha expired or already used, please try again');
    });
  });
});
