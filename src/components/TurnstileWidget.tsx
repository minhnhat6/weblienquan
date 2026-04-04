'use client';

/**
 * Cloudflare Turnstile CAPTCHA Component
 * 
 * Usage:
 * ```tsx
 * const [captchaToken, setCaptchaToken] = useState<string>('');
 * <TurnstileWidget onVerify={setCaptchaToken} />
 * ```
 * 
 * Environment:
 * - NEXT_PUBLIC_TURNSTILE_SITE_KEY: Client-side site key from Cloudflare
 */

import { useEffect, useRef, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (error: string) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

// ─── Component ─────────────────────────────────────────────────────────────────

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey) return;
    if (widgetIdRef.current) return; // Already rendered

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'error-callback': onError,
        'expired-callback': onExpire,
        theme,
        size,
      });
    } catch (error) {
      console.error('[Turnstile] Render error:', error);
      onError?.('Failed to load captcha');
    }
  }, [siteKey, onVerify, onError, onExpire, theme, size]);

  useEffect(() => {
    // Check if site key is configured
    if (!siteKey) {
      console.warn('[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured');
      // Auto-verify in development when not configured
      if (process.env.NODE_ENV === 'development') {
        onVerify('dev-bypass-token');
      }
      return;
    }

    // Load Turnstile script if not already loaded
    if (!scriptLoadedRef.current && !window.turnstile) {
      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      // Security: Add crossOrigin for proper error reporting
      script.crossOrigin = 'anonymous';
      // Note: SRI hash should be updated when Cloudflare updates their script
      // script.integrity = 'sha384-...'; // Cloudflare doesn't provide stable SRI hashes
      script.onload = () => {
        scriptLoadedRef.current = true;
        renderWidget();
      };
      script.onerror = () => {
        console.error('[Turnstile] Failed to load script');
        onError?.('Failed to load captcha');
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    }

    // Cleanup on unmount
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore removal errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, renderWidget, onVerify, onError]);

  // Don't render anything if not configured (dev mode)
  if (!siteKey) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`turnstile-container ${className}`}
      data-testid="turnstile-widget"
    />
  );
}

// ─── Hook for Manual Control ───────────────────────────────────────────────────

export function useTurnstileReset() {
  return useCallback((widgetId: string) => {
    if (window.turnstile) {
      window.turnstile.reset(widgetId);
    }
  }, []);
}
