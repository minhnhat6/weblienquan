/**
 * RequireAuth Component
 * Wrapper that redirects unauthenticated users to login page
 * Security: Validates redirect URLs to prevent open redirect attacks
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// ─── Constants ─────────────────────────────────────────────────────────────────

const REDIRECT_DELAY_MS = 50;
const LOGIN_PATH = '/client/login';
const DEFAULT_REDIRECT = '/client/orders';

// Allowed redirect prefixes for client pages
const ALLOWED_PREFIXES = ['/client/'];

// ─── Security Helpers ──────────────────────────────────────────────────────────

/**
 * Validate redirect URL to prevent open redirect attacks
 * Only allows relative URLs starting with allowed prefixes
 */
function isValidRedirectUrl(url: string): boolean {
  // Must be a relative URL starting with /
  if (!url || !url.startsWith('/')) return false;
  
  // Block protocol-relative URLs (//evil.com)
  if (url.startsWith('//')) return false;
  
  // Block URLs with suspicious characters
  if (url.includes('..') || url.includes('\n') || url.includes('\r')) return false;
  
  // Must start with an allowed prefix
  return ALLOWED_PREFIXES.some(prefix => url.startsWith(prefix));
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <>
      <Header />
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        color: 'var(--text-muted)', fontSize: 15,
      }}>
        <div style={{
          width: 44, height: 44, border: '4px solid var(--border-color)',
          borderTopColor: 'var(--purple-main)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span>Đang chuyển hướng đến trang đăng nhập...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <Footer />
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null) {
      // Validate redirect URL to prevent open redirect attacks
      const safeRedirect = isValidRedirectUrl(pathname) ? pathname : DEFAULT_REDIRECT;
      const redirectUrl = `${LOGIN_PATH}?redirect=${encodeURIComponent(safeRedirect)}`;
      const timer = setTimeout(() => router.replace(redirectUrl), REDIRECT_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [user, router, pathname]);

  if (user === null) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
