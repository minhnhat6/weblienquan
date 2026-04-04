import { expect, test } from '@playwright/test';

test('user registration with valid email', async ({ page }) => {
  await page.goto('/client/register');

  const username = `user_${Date.now()}`;
  await page.getByPlaceholder('Nhập tên đăng nhập').fill(username);
  await page.getByPlaceholder('Nhập email').fill(`${username}@example.com`);
  await page.getByPlaceholder('Nhập mật khẩu').fill('password123');
  await page.getByPlaceholder('Xác nhận mật khẩu').fill('password123');
  await page.getByRole('button', { name: 'Đăng Ký' }).click();

  // Should redirect to home after successful registration
  await expect(page).toHaveURL('/');
});

test('unauthorized upload attempt fails', async ({ page }) => {
  // Try to access upload API without login
  const response = await page.request.post('/api/upload', {
    multipart: {
      file: {
        name: 'test.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
      },
    },
  });

  // Should return 401 Unauthorized
  expect(response.status()).toBe(401);
});
