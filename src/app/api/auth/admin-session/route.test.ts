// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { GET, POST } from './route';

describe('/api/auth/admin-session', () => {
  it('issues admin session cookie with valid credentials', async () => {
    const req = new Request('http://localhost/api/auth/admin-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const setCookie = res.headers.get('set-cookie') || '';
    expect(setCookie).toContain('slq_admin_session=');
    expect(setCookie.toLowerCase()).toContain('httponly');
  });

  it('returns unauthorized without valid cookie on GET', async () => {
    const req = new Request('http://localhost/api/auth/admin-session', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
