/**
 * Server-side observability helper
 * Lightweight logging for API routes and server components
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

type EventData = Record<string, unknown>;
type ErrorContext = Record<string, unknown>;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const isDevelopment = process.env.NODE_ENV === 'development';

// ─── Public API ────────────────────────────────────────────────────────────────

/** Log a business event (e.g., user action, transaction) */
export function logBusinessEvent(type: string, data: EventData): void {
  if (isDevelopment) {
    console.log(`[BusinessEvent] ${type}:`, data);
  }
  // Production: send to logging service (DataDog, Sentry, CloudWatch, etc.)
}

/** Log an error with context */
export function logError(message: string, error: unknown, context?: ErrorContext): void {
  console.error(`[Error] ${message}:`, error, context);
  // Production: send to error tracking service
}

/** Log performance metrics */
export function logPerf(path: string, method: string, durationMs: number, status: number): void {
  if (isDevelopment) {
    console.log(`[Perf] ${method} ${path}: ${durationMs}ms (${status})`);
  }
  // Production: send to monitoring service
}
