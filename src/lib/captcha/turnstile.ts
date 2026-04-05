/**
 * Cloudflare Turnstile CAPTCHA Verification
 * Server-side validation for Turnstile tokens
 * 
 * Environment variables required:
 * - TURNSTILE_SECRET_KEY: Server-side secret from Cloudflare dashboard
 * 
 * Client-side integration:
 * - Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to env
 * - Use <Turnstile> component or manual integration
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export interface CaptchaVerifyResult {
  success: boolean;
  error?: string;
}

// ─── Configuration ─────────────────────────────────────────────────────────────

function getSecretKey(): string {
  const key = process.env.TURNSTILE_SECRET_KEY;
  if (!key) {
    // Log warning but don't crash - CAPTCHA is optional if not configured
    console.warn(
      '[CAPTCHA] TURNSTILE_SECRET_KEY not set - captcha verification disabled. ' +
      'Set TURNSTILE_SECRET_KEY in environment for production security.'
    );
    return '';
  }
  return key;
}

/**
 * Check if captcha is enabled (secret key is configured)
 * In production, this should always return true
 */
export function isCaptchaEnabled(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

// ─── Verification ──────────────────────────────────────────────────────────────

/**
 * Verify a Cloudflare Turnstile token
 * @param token - The cf-turnstile-response token from client
 * @param remoteIp - Optional client IP for additional verification
 * @returns Verification result with success status and optional error
 */
export async function verifyCaptcha(
  token: string | null | undefined,
  remoteIp?: string
): Promise<CaptchaVerifyResult> {
  // Skip verification if not configured (dev mode)
  const secretKey = getSecretKey();
  if (!secretKey) {
    return { success: true };
  }

  // Token is required when captcha is enabled
  if (!token) {
    return { success: false, error: 'Captcha token is required' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error('[CAPTCHA] Turnstile API error:', response.status);
      return { success: false, error: 'Captcha verification service unavailable' };
    }

    const result: TurnstileVerifyResponse = await response.json();

    if (!result.success) {
      const errorCodes = result['error-codes'] || [];
      console.warn('[CAPTCHA] Verification failed:', errorCodes);
      
      // Map error codes to user-friendly messages
      const errorMessage = mapErrorCode(errorCodes[0]);
      return { success: false, error: errorMessage };
    }

    return { success: true };

  } catch (error) {
    console.error('[CAPTCHA] Verification error:', error);
    return { success: false, error: 'Captcha verification failed' };
  }
}

// ─── Error Mapping ─────────────────────────────────────────────────────────────

function mapErrorCode(code?: string): string {
  const errorMap: Record<string, string> = {
    'missing-input-secret': 'Server configuration error',
    'invalid-input-secret': 'Server configuration error',
    'missing-input-response': 'Captcha response is missing',
    'invalid-input-response': 'Captcha response is invalid',
    'bad-request': 'Invalid captcha request',
    'timeout-or-duplicate': 'Captcha expired or already used, please try again',
    'internal-error': 'Captcha service error, please try again',
  };

  return errorMap[code || ''] || 'Captcha verification failed';
}
