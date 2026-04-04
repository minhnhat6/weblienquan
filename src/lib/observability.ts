/**
 * Observability - Business events, error tracking, and performance logging
 * Stores logs in localStorage with automatic rotation
 */

import type {
  BusinessEventType,
  BusinessLogEvent,
  ClientErrorEvent,
  ClientErrorType,
  PerfEvent,
} from './types';

// Re-export types for backwards compatibility
export type { BusinessEventType, BusinessLogEvent, ClientErrorEvent, PerfEvent };

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  business: 'slq_business_logs',
  error: 'slq_error_logs',
  perf: 'slq_perf_logs',
} as const;

const DEFAULT_LOG_LIMIT = 500;

// ─── Storage Helpers ───────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function generateLogId(): string {
  // Use crypto.getRandomValues in browser for secure random
  if (isBrowser() && window.crypto?.getRandomValues) {
    const array = new Uint8Array(6);
    window.crypto.getRandomValues(array);
    return `log-${Date.now()}-${Array.from(array, b => b.toString(16).padStart(2, '0')).join('')}`;
  }
  return `log-${Date.now()}-${Date.now().toString(36)}`;
}

function safeGetFromStorage<T>(key: string): T[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function safeSetToStorage<T>(key: string, items: T[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(items));
}

function appendLog<T extends object>(
  key: string,
  event: T,
  limit = DEFAULT_LOG_LIMIT
): void {
  const enrichedEvent = {
    ...event,
    id: (event as { id?: string }).id || generateLogId(),
    ts: (event as { ts?: string }).ts || new Date().toISOString(),
  };

  const current = safeGetFromStorage<T>(key);
  const updated = [enrichedEvent as T, ...current].slice(0, limit);
  safeSetToStorage(key, updated);
}

// ─── Public API ────────────────────────────────────────────────────────────────

/** Log a business event (orders, recharges, user actions) */
export function logBusinessEvent(event: Omit<BusinessLogEvent, 'id' | 'ts'>): void {
  appendLog(STORAGE_KEYS.business, event);
}

/** Log a client-side error */
export function logClientError(event: Omit<ClientErrorEvent, 'id' | 'ts'>): void {
  appendLog(STORAGE_KEYS.error, event);
}

/** Log an HTTP performance event */
export function logPerfEvent(event: Omit<PerfEvent, 'id' | 'ts'>): void {
  appendLog(STORAGE_KEYS.perf, event);
}

/** Get all business logs */
export function getBusinessLogs(): BusinessLogEvent[] {
  return safeGetFromStorage<BusinessLogEvent>(STORAGE_KEYS.business);
}

/** Get all error logs */
export function getErrorLogs(): ClientErrorEvent[] {
  return safeGetFromStorage<ClientErrorEvent>(STORAGE_KEYS.error);
}

/** Get all performance logs */
export function getPerfLogs(): PerfEvent[] {
  return safeGetFromStorage<PerfEvent>(STORAGE_KEYS.perf);
}

/** Clear all observability logs */
export function clearObservabilityLogs(): void {
  if (!isBrowser()) return;

  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
