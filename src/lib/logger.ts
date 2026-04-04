/**
 * Production-grade structured JSON logging and monitoring utilities
 * Supports log aggregation services (CloudWatch, Datadog, Logtail)
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  userId?: string;
  username?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  stack?: string;
  errorName?: string;
  requestId?: string;
  duration?: number;
  statusCode?: number;
  path?: string;
  method?: string;
  ip?: string;
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  message: string;
  context?: LogContext;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

export interface ErrorLog {
  message: string;
  stack?: string;
  context?: LogContext;
  level: LogLevel;
  timestamp: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_SERVICE_NAME = 'weblienquan';
const TELEMETRY_ENDPOINT = '/api/telemetry/error';

// Emoji prefixes for console (development)
const LOG_PREFIXES: Record<LogLevel, string> = {
  info: 'ℹ️ INFO',
  warn: '⚠️ WARN',
  error: '❌ ERROR',
  debug: '🔍 DEBUG',
};

// ─── Logger Class ──────────────────────────────────────────────────────────────

class Logger {
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly isProduction: boolean;
  private readonly isDevelopment: boolean;
  private readonly useStructuredFormat: boolean;

  constructor(
    serviceName = DEFAULT_SERVICE_NAME,
    environment = process.env.NODE_ENV || 'development'
  ) {
    this.serviceName = serviceName;
    this.environment = environment;
    this.isProduction = environment === 'production';
    this.isDevelopment = environment === 'development';
    // Use structured JSON logging in production
    this.useStructuredFormat = this.isProduction || !!process.env.LOG_FORMAT_JSON;
  }

  /** Log an informational message */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /** Log a warning */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /** Log an error */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      stack: error?.stack,
      errorName: error?.name,
    };
    this.log('error', message, errorContext, error);

    if (this.isProduction) {
      this.sendToErrorTracking(message, error, errorContext);
    }
  }

  /** Log a debug message (only in development) */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /** Log business events (important user actions) */
  event(eventName: string, context?: LogContext): void {
    this.log('info', `[EVENT] ${eventName}`, {
      ...context,
      action: eventName,
    });

    if (this.isProduction) {
      this.sendToAnalytics(eventName, context);
    }
  }

  /** Log HTTP request (for middleware/API routes) */
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: Partial<LogContext>
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${path} ${statusCode} ${duration}ms`, {
      ...context,
      method,
      path,
      statusCode,
      duration,
    });
  }

  /** Log security event */
  security(event: string, context?: LogContext): void {
    this.log('warn', `[SECURITY] ${event}`, {
      ...context,
      action: `security:${event}`,
    });
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const timestamp = new Date().toISOString();
    
    if (this.useStructuredFormat) {
      // Structured JSON logging for production
      const structuredLog: StructuredLog = {
        timestamp,
        level,
        service: this.serviceName,
        environment: this.environment,
        message,
        context: context ? this.sanitizeContext(context) : undefined,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
      };
      
      // Output single-line JSON for log aggregation
      const output = JSON.stringify(structuredLog);
      if (level === 'error') {
        console.error(output);
      } else {
        console.log(output);
      }
    } else {
      // Human-readable format for development
      const prefix = LOG_PREFIXES[level];
      const contextStr = context ? ` ${JSON.stringify(this.sanitizeContext(context))}` : '';
      const consoleMethod = level === 'error' ? 'error' : 'log';
      console[consoleMethod](`${prefix} [${this.serviceName}] ${message}${contextStr}`);
      
      if (error?.stack && level === 'error') {
        console.error(error.stack);
      }
    }

    if (this.isProduction) {
      this.persistLog({
        message,
        level,
        timestamp,
        context: { ...context, timestamp },
      });
    }
  }

  /** Remove sensitive data from context before logging */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };
    
    // Remove potentially sensitive fields from metadata
    if (sanitized.metadata) {
      const { password, token, secret, apiKey, ...safeMetadata } = sanitized.metadata as Record<string, unknown>;
      sanitized.metadata = safeMetadata;
    }
    
    // Truncate stack traces in production
    if (this.isProduction && sanitized.stack) {
      const lines = sanitized.stack.split('\n');
      sanitized.stack = lines.slice(0, 5).join('\n');
    }
    
    return sanitized;
  }

  private sendToErrorTracking(message: string, error?: Error, context?: LogContext): void {
    // TODO: Integrate with Sentry or similar service
    // Example: Sentry.captureException(error, { extra: context });

    if (typeof window !== 'undefined') {
      fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, error: error?.stack, context }),
      }).catch(() => {
        // Silent fail - don't break app if telemetry fails
      });
    }
  }

  private sendToAnalytics(eventName: string, context?: LogContext): void {
    // TODO: Integrate with analytics service (Google Analytics, Mixpanel, etc.)
    console.log(`📊 Analytics: ${eventName}`, context);
  }

  private async persistLog(logEntry: ErrorLog): Promise<void> {
    // Log persistence implementation
    // Supports multiple backends via environment configuration
    
    const logServiceUrl = process.env.LOG_SERVICE_URL;
    const logServiceToken = process.env.LOG_SERVICE_TOKEN;
    
    if (!logServiceUrl) {
      // No external log service configured - logs go to stdout only
      return;
    }

    try {
      // Format log for external service
      const payload = {
        ...logEntry,
        service: this.serviceName,
        environment: this.environment,
        hostname: typeof process !== 'undefined' ? process.env.HOSTNAME || 'unknown' : 'browser',
      };

      // Send to log aggregation service (Logtail, Datadog, CloudWatch, etc.)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (logServiceToken) {
        headers['Authorization'] = `Bearer ${logServiceToken}`;
      }

      // Use non-blocking fetch for log shipping
      if (typeof fetch !== 'undefined') {
        fetch(logServiceUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }).catch(() => {
          // Silent fail - don't break app if log shipping fails
        });
      }
    } catch {
      // Silent fail - logging should never break the app
    }
  }
}

// ─── Singleton Instance ────────────────────────────────────────────────────────

export const logger = new Logger();

// ─── Business Event Helpers ────────────────────────────────────────────────────

export const logEvent = {
  userLogin: (username: string) => 
    logger.event('USER_LOGIN', { username }),
  
  userRegister: (username: string) => 
    logger.event('USER_REGISTER', { username }),
  
  adminLogin: (username: string) => 
    logger.event('ADMIN_LOGIN', { username }),
  
  productPurchase: (userId: string, productId: string, amount: number) =>
    logger.event('PRODUCT_PURCHASE', { userId, metadata: { productId, amount } }),
  
  rechargeRequest: (userId: string, amount: number) =>
    logger.event('RECHARGE_REQUEST', { userId, metadata: { amount } }),
  
  rechargeApproved: (userId: string, amount: number) =>
    logger.event('RECHARGE_APPROVED', { userId, metadata: { amount } }),
  
  rechargeRejected: (userId: string, amount: number, reason: string) =>
    logger.event('RECHARGE_REJECTED', { userId, metadata: { amount, reason } }),
  
  uploadSuccess: (userId: string, fileName: string) =>
    logger.event('FILE_UPLOAD', { userId, metadata: { fileName } }),
};

// ─── Error Helpers ─────────────────────────────────────────────────────────────

export const logError = {
  authFailed: (username: string, reason: string) =>
    logger.error(`Authentication failed: ${reason}`, undefined, { username }),
  
  rateLimitExceeded: (identifier: string) =>
    logger.warn('Rate limit exceeded', { metadata: { identifier } }),
  
  invalidInput: (field: string, value: string) =>
    logger.warn('Invalid input', { metadata: { field, value } }),
  
  serverError: (error: Error, context?: LogContext) =>
    logger.error('Server error', error, context),
};
