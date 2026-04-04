/**
 * Server-side rate limiter with Redis and in-memory fallback
 * 
 * Features:
 * - Persistent rate limiting with Redis (multi-instance support)
 * - Automatic fallback to in-memory when Redis unavailable
 * - Configurable per-endpoint limits
 * 
 * Environment:
 * - REDIS_URL: Redis connection string (optional, falls back to in-memory)
 */

import Redis from 'ioredis';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  resetIn?: number;
}

interface RateLimitStats {
  totalKeys: number;
  lockedKeys: number;
  backend: 'redis' | 'memory';
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_LOCK_MS = 15 * 60 * 1000;   // 15 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const REDIS_KEY_PREFIX = 'ratelimit:';

// ─── Redis Client ──────────────────────────────────────────────────────────────

let redisClient: Redis | null = null;
let redisAvailable = false;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[RateLimiter] Redis connection failed, using in-memory fallback');
          redisAvailable = false;
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      console.log('[RateLimiter] Redis connected');
      redisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.warn('[RateLimiter] Redis error:', err.message);
      redisAvailable = false;
    });

    redisClient.on('close', () => {
      redisAvailable = false;
    });

    // Try to connect
    redisClient.connect().catch(() => {
      redisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    console.warn('[RateLimiter] Redis initialization failed:', error);
    return null;
  }
}

// ─── Rate Limiter Class ────────────────────────────────────────────────────────

class RateLimiter {
  private readonly memoryStore = new Map<string, RateLimitEntry>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly lockMs: number;
  private readonly name: string;

  constructor(
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    windowMs = DEFAULT_WINDOW_MS,
    lockMs = DEFAULT_LOCK_MS,
    name = 'default'
  ) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.lockMs = lockMs;
    this.name = name;

    // Initialize Redis client
    getRedisClient();

    // Periodic cleanup of in-memory expired entries
    setInterval(() => this.cleanupMemory(), CLEANUP_INTERVAL_MS);
  }

  /** Check if request is allowed */
  async check(key: string): Promise<RateLimitResult> {
    const fullKey = `${REDIS_KEY_PREFIX}${this.name}:${key}`;
    
    // Try Redis first
    if (redisAvailable && redisClient) {
      try {
        return await this.checkRedis(fullKey);
      } catch {
        // Fall back to memory
      }
    }
    
    return this.checkMemory(key);
  }

  /** Synchronous check (memory only) - for backward compatibility */
  checkSync(key: string): RateLimitResult {
    return this.checkMemory(key);
  }

  private async checkRedis(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const data = await redisClient!.get(key);

    if (!data) {
      return { allowed: true, remainingAttempts: this.maxAttempts };
    }

    const entry: RateLimitEntry = JSON.parse(data);

    if (now >= entry.resetAt) {
      await redisClient!.del(key);
      return { allowed: true, remainingAttempts: this.maxAttempts };
    }

    if (entry.attempts >= this.maxAttempts) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetIn: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - entry.attempts,
    };
  }

  private checkMemory(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.memoryStore.get(key);

    if (!entry || now >= entry.resetAt) {
      this.memoryStore.set(key, { attempts: 0, resetAt: now + this.windowMs });
      return { allowed: true, remainingAttempts: this.maxAttempts };
    }

    if (entry.attempts >= this.maxAttempts) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetIn: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - entry.attempts,
    };
  }

  /** Record a failed attempt */
  async recordFailure(key: string): Promise<void> {
    const fullKey = `${REDIS_KEY_PREFIX}${this.name}:${key}`;
    
    if (redisAvailable && redisClient) {
      try {
        await this.recordFailureRedis(fullKey);
        return;
      } catch {
        // Fall back to memory
      }
    }
    
    this.recordFailureMemory(key);
  }

  /** Synchronous record failure (memory only) */
  recordFailureSync(key: string): void {
    this.recordFailureMemory(key);
  }

  /** Record failure to Redis only (for SyncRateLimiter background sync) */
  async recordFailureRedisOnly(key: string): Promise<void> {
    if (!redisAvailable || !redisClient) return;
    
    const fullKey = `${REDIS_KEY_PREFIX}${this.name}:${key}`;
    try {
      await this.recordFailureRedis(fullKey);
    } catch {
      // Ignore Redis errors
    }
  }

  private async recordFailureRedis(key: string): Promise<void> {
    const now = Date.now();
    const data = await redisClient!.get(key);
    
    let entry: RateLimitEntry;
    
    if (!data) {
      entry = { attempts: 1, resetAt: now + this.windowMs };
    } else {
      entry = JSON.parse(data);
      
      if (now >= entry.resetAt) {
        entry = { attempts: 1, resetAt: now + this.windowMs };
      } else {
        entry.attempts += 1;
        if (entry.attempts >= this.maxAttempts) {
          entry.resetAt = now + this.lockMs;
        }
      }
    }

    const ttlMs = entry.resetAt - now;
    await redisClient!.set(key, JSON.stringify(entry), 'PX', Math.max(ttlMs, 1000));
  }

  private recordFailureMemory(key: string): void {
    const now = Date.now();
    const entry = this.memoryStore.get(key);

    if (!entry || now >= entry.resetAt) {
      this.memoryStore.set(key, { attempts: 1, resetAt: now + this.windowMs });
      return;
    }

    entry.attempts += 1;

    if (entry.attempts >= this.maxAttempts) {
      entry.resetAt = now + this.lockMs;
    }
  }

  /** Clear rate limit for a key */
  async clear(key: string): Promise<void> {
    const fullKey = `${REDIS_KEY_PREFIX}${this.name}:${key}`;
    
    if (redisAvailable && redisClient) {
      try {
        await redisClient.del(fullKey);
      } catch {
        // Ignore
      }
    }
    
    this.memoryStore.delete(key);
  }

  /** Get stats for monitoring */
  getStats(): RateLimitStats {
    const now = Date.now();
    let lockedKeys = 0;

    for (const entry of this.memoryStore.values()) {
      if (entry.attempts >= this.maxAttempts && now < entry.resetAt) {
        lockedKeys++;
      }
    }

    return {
      totalKeys: this.memoryStore.size,
      lockedKeys,
      backend: redisAvailable ? 'redis' : 'memory',
    };
  }

  /** Remove expired entries from memory */
  private cleanupMemory(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (now >= entry.resetAt) {
        this.memoryStore.delete(key);
      }
    }
  }
}

// ─── Backward Compatible Wrapper ───────────────────────────────────────────────

class SyncRateLimiter {
  private readonly limiter: RateLimiter;

  constructor(
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    windowMs = DEFAULT_WINDOW_MS,
    lockMs = DEFAULT_LOCK_MS,
    name = 'default'
  ) {
    this.limiter = new RateLimiter(maxAttempts, windowMs, lockMs, name);
  }

  /** Check if request is allowed (sync, memory-first) */
  check(key: string): RateLimitResult {
    return this.limiter.checkSync(key);
  }

  /** Record a failed attempt (sync) */
  recordFailure(key: string): void {
    this.limiter.recordFailureSync(key);
    // Also try async Redis in background (memory already updated via sync call)
    this.limiter.recordFailureRedisOnly(key).catch(() => {});
  }

  /** Clear rate limit */
  clear(key: string): void {
    this.limiter.clear(key).catch(() => {});
  }

  /** Get stats */
  getStats(): RateLimitStats {
    return this.limiter.getStats();
  }
}

// ─── Singleton Instances ───────────────────────────────────────────────────────

// Login: 5 attempts per 15 minutes (strict for security)
export const loginRateLimiter = new SyncRateLimiter(5, 15 * 60 * 1000, 15 * 60 * 1000, 'login');

// API: 60 requests per minute per user (more permissive)
export const apiRateLimiter = new SyncRateLimiter(60, 60 * 1000, 60 * 1000, 'api');

// Order creation: 10 orders per minute per user (prevent abuse)
export const orderRateLimiter = new SyncRateLimiter(10, 60 * 1000, 5 * 60 * 1000, 'order');

// Recharge requests: 5 per hour per user
export const rechargeRateLimiter = new SyncRateLimiter(5, 60 * 60 * 1000, 60 * 60 * 1000, 'recharge');

// Telemetry: 100 requests per minute per IP (prevent log spam)
export const telemetryRateLimiter = new SyncRateLimiter(100, 60 * 1000, 60 * 1000, 'telemetry');

// Upload: 50 uploads per minute per admin (prevent abuse)
export const uploadRateLimiter = new SyncRateLimiter(50, 60 * 1000, 5 * 60 * 1000, 'upload');

// Admin API: 120 requests per minute per admin (prevent DoS on admin endpoints)
export const adminApiRateLimiter = new SyncRateLimiter(120, 60 * 1000, 60 * 1000, 'admin-api');

// Export classes for testing and custom use
export { RateLimiter, SyncRateLimiter };

// Export Redis status check
export function isRedisAvailable(): boolean {
  return redisAvailable;
}
