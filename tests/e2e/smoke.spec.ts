import { expect, test } from '@playwright/test';

test('smoke flow: login -> recharge request -> buy -> orders', async ({ page }) => {
  const username = `smoke_${Date.now()}`;
  const password = 'secret123';

  // Step 1: Register new user
  await page.goto('/client/register');
  await page.getByPlaceholder('Nhập tên đăng nhập').fill(username);
  await page.getByPlaceholder('Nhập email').fill(`${username}@example.com`);
  await page.getByPlaceholder('Nhập mật khẩu').fill(password);
  await page.getByPlaceholder('Xác nhận mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng Ký' }).click();
  await expect(page).toHaveURL('/');

  // TODO: Remove this localStorage hack after Phase 13 (server-side auth)
  // Currently needed because there's no way to approve recharge without admin login
  // This simulates admin approving a recharge request
  await page.evaluate(() => {
    const rawUser = localStorage.getItem('slq_user');
    const rawUsers = localStorage.getItem('slq_users');
    if (!rawUser || !rawUsers) return;

    const sessionUser = JSON.parse(rawUser);
    const users = JSON.parse(rawUsers);
    const idx = users.findIndex((u: { id: string }) => u.id === sessionUser.id);
    if (idx >= 0) users[idx].balance = 999999;

    sessionUser.balance = 999999;
    localStorage.setItem('slq_user', JSON.stringify(sessionUser));
    localStorage.setItem('slq_users', JSON.stringify(users));
  });

  await page.reload();

  // Step 2: Create recharge request
  await page.goto('/client/recharge');
  await page.getByPlaceholder('Nhập số tiền (VNĐ)').fill('10000');
  await page.getByRole('button', { name: '💳 Nạp Tiền' }).click();
  await page.getByRole('button', { name: '✅ Đã chuyển khoản' }).click();

  // Step 3: Purchase product
  await page.goto('/');
  await page.locator('.product-card').first().click();
  await page.getByRole('button', { name: /MUA & NHẬN ACC/i }).click();
  await expect(page.getByText('🎉 Mua Hàng Thành Công!')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng' }).click();

  // Step 4: Verify order history
  await page.goto('/client/orders');
  await expect(page.locator('.section-title').filter({ hasText: '📦 Lịch Sử Mua Hàng' })).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
});
