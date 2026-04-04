import { describe, expect, it } from 'vitest';
import { createAdminSessionToken, verifyAdminSessionToken } from '@/lib/server-session';

describe('server admin session token', () => {
  it('creates and verifies valid admin token', async () => {
    const token = await createAdminSessionToken({
      sub: 'admin-001',
      username: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    const payload = await verifyAdminSessionToken(token);
    expect(payload?.role).toBe('admin');
    expect(payload?.sub).toBe('admin-001');
  });

  it('rejects expired token', async () => {
    const token = await createAdminSessionToken({
      sub: 'admin-001',
      username: 'admin',
      exp: Math.floor(Date.now() / 1000) - 5,
    });

    const payload = await verifyAdminSessionToken(token);
    expect(payload).toBeNull();
  });
});
