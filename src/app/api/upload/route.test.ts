// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  appendFile: vi.fn().mockResolvedValue(undefined),
}));

import { appendFile, mkdir, writeFile } from 'fs/promises';
import { POST } from './route';
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from '@/lib/server-session';

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when role is not admin', async () => {
    const nonAdminLikeToken = await createAdminSessionToken({
      sub: 'user-001',
      username: 'user',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE}=${nonAdminLikeToken.slice(0, -4)}tamper`,
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401); // Changed from 403 to 401 (Unauthorized)
    expect(body.success).toBe(false);
    expect(appendFile).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for unsupported MIME type', async () => {
    const adminToken = await createAdminSessionToken({
      sub: 'admin-001',
      username: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const form = new FormData();
    form.append('file', new File(['hello'], 'note.txt', { type: 'text/plain' }));

    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: form,
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE}=${adminToken}`,
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(writeFile).not.toHaveBeenCalled();
    expect(appendFile).toHaveBeenCalledTimes(1);
  });

  it('uploads valid image for admin role', async () => {
    const adminToken = await createAdminSessionToken({
      sub: 'admin-001',
      username: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    
    // Create a valid PNG file with correct magic bytes
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const pngMagicBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x00]);
    const form = new FormData();
    form.append('file', new File([pngMagicBytes], 'Test Image.png', { type: 'image/png' }));

    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: form,
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE}=${adminToken}`,
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.urls)).toBe(true);
    expect(body.urls).toHaveLength(1);
    expect(body.urls[0]).toMatch(/^\/uploads\/.+/);
    expect(body.urls[0]).toContain('test-image.png');

    expect(mkdir).toHaveBeenCalledTimes(2);
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(appendFile).toHaveBeenCalledTimes(1);
  });
});
