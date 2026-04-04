import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SyncRateLimiter, isRedisAvailable } from './rate-limiter';

describe('SyncRateLimiter', () => {
  let limiter: SyncRateLimiter;
  const testKey = 'test-user';

  beforeEach(() => {
    limiter = new SyncRateLimiter(3, 1000, 2000, 'test'); // 3 attempts, 1s window, 2s lock
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows requests initially', () => {
    const result = limiter.check(testKey);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(3);
  });

  it('blocks after max attempts reached', () => {
    // Record 3 failures
    limiter.recordFailure(testKey);
    limiter.recordFailure(testKey);
    limiter.recordFailure(testKey);

    const result = limiter.check(testKey);
    expect(result.allowed).toBe(false);
    expect(result.remainingAttempts).toBe(0);
    expect(result.resetIn).toBeGreaterThan(0);
  });

  it('allows requests again after window expires', async () => {
    vi.useFakeTimers();

    // Record 2 failures (below max)
    limiter.recordFailure(testKey);
    limiter.recordFailure(testKey);

    // Advance time past window
    vi.advanceTimersByTime(1100);

    const result = limiter.check(testKey);
    expect(result.allowed).toBe(true);

    vi.useRealTimers();
  });

  it('clears rate limit on successful action', () => {
    limiter.recordFailure(testKey);
    limiter.recordFailure(testKey);

    limiter.clear(testKey);

    const result = limiter.check(testKey);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(3);
  });

  it('provides accurate stats', () => {
    limiter.recordFailure('user1');
    limiter.recordFailure('user2');
    limiter.recordFailure('user2');
    limiter.recordFailure('user2'); // user2 locked

    const stats = limiter.getStats();
    expect(stats.totalKeys).toBe(2);
    expect(stats.lockedKeys).toBe(1);
    expect(stats.backend).toBe('memory'); // No Redis in test
  });

  it('counts remaining attempts correctly', () => {
    const result1 = limiter.check(testKey);
    expect(result1.remainingAttempts).toBe(3);

    limiter.recordFailure(testKey);
    const result2 = limiter.check(testKey);
    expect(result2.remainingAttempts).toBe(2);

    limiter.recordFailure(testKey);
    const result3 = limiter.check(testKey);
    expect(result3.remainingAttempts).toBe(1);
  });

  it('extends lock time when max attempts reached', async () => {
    vi.useFakeTimers();

    limiter.recordFailure(testKey);
    limiter.recordFailure(testKey);
    limiter.recordFailure(testKey); // Max reached, lock for 2s

    // After 1s (within lock period)
    vi.advanceTimersByTime(1000);
    const result1 = limiter.check(testKey);
    expect(result1.allowed).toBe(false);

    // After another 1.5s (past lock period)
    vi.advanceTimersByTime(1500);
    const result2 = limiter.check(testKey);
    expect(result2.allowed).toBe(true);

    vi.useRealTimers();
  });
});

describe('isRedisAvailable', () => {
  it('returns false when REDIS_URL not configured', () => {
    // By default in tests, REDIS_URL is not set
    expect(isRedisAvailable()).toBe(false);
  });
});
