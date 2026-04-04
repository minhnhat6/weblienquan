/**
 * ErrorTracker Component
 * Global error and performance tracking for client-side events
 */

'use client';

import { useEffect } from 'react';
import { logClientError, logPerfEvent } from '@/lib/observability';

// ─── Constants ─────────────────────────────────────────────────────────────────

const TELEMETRY_ENDPOINT = '/api/telemetry/error';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ErrorPayload {
  type: 'window.error' | 'unhandledrejection' | 'http.error';
  message: string;
  stack?: string;
  route: string;
  meta?: Record<string, unknown>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractPath(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return 'unknown';
}

async function reportError(payload: ErrorPayload): Promise<void> {
  try {
    await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // best-effort logging only
  }
}

function createWindowErrorHandler() {
  return (event: ErrorEvent) => {
    const data: ErrorPayload = {
      type: 'window.error',
      message: event.message || 'Unknown runtime error',
      stack: event.error?.stack,
      route: window.location.pathname,
    };
    logClientError(data);
    void reportError(data);
  };
}

function createUnhandledRejectionHandler() {
  return (event: PromiseRejectionEvent) => {
    const isError = event.reason instanceof Error;
    const data: ErrorPayload = {
      type: 'unhandledrejection',
      message: isError ? event.reason.message : String(event.reason),
      stack: isError ? event.reason.stack : undefined,
      route: window.location.pathname,
    };
    logClientError(data);
    void reportError(data);
  };
}

function createFetchWrapper(originalFetch: typeof fetch) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const start = performance.now();
    const path = extractPath(input);
    const method = (init?.method || 'GET').toUpperCase();

    try {
      const response = await originalFetch(input, init);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      logPerfEvent({ kind: 'http', path, method, status: response.status, ok: response.ok, durationMs });

      if (!response.ok) {
        const errPayload: ErrorPayload = {
          type: 'http.error',
          message: `HTTP ${response.status} at ${path}`,
          route: window.location.pathname,
          meta: { method, status: response.status, durationMs },
        };
        logClientError(errPayload);
        void reportError(errPayload);
      }

      return response;
    } catch (error) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const isError = error instanceof Error;

      logPerfEvent({ kind: 'http', path, method, status: 0, ok: false, durationMs });

      const errPayload: ErrorPayload = {
        type: 'http.error',
        message: `Fetch failed at ${path}: ${isError ? error.message : String(error)}`,
        stack: isError ? error.stack : undefined,
        route: window.location.pathname,
        meta: { method, status: 0, durationMs },
      };
      logClientError(errPayload);
      void reportError(errPayload);
      throw error;
    }
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ErrorTracker() {
  useEffect(() => {
    const onWindowError = createWindowErrorHandler();
    const onUnhandledRejection = createUnhandledRejectionHandler();
    const originalFetch = window.fetch.bind(window);
    
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.fetch = createFetchWrapper(originalFetch);

    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
