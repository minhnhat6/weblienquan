import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from '@/lib/auth';

/**
 * DEPRECATED: These admin functions use localStorage directly.
 * Phase 13 moved admin operations to API routes:
 * - PUT /api/admin/recharge/:id (approve/reject)
 * - PUT /api/admin/users/:id (update user)
 * 
 * These tests are skipped pending migration to API-based integration tests.
 */

function AdminHarness() {
  const { approveRecharge, updateUser } = useAuth();

  return (
    <div>
      <button onClick={() => approveRecharge('RCH-1')}>approve-recharge</button>
      <button onClick={() => updateUser('user-001', { role: 'admin', discount: 15, balance: 123000 })}>
        update-user
      </button>
    </div>
  );
}

describe.skip('Admin flow methods', () => {
  beforeEach(() => {
    localStorage.clear();

    // Set admin user in session to simulate logged-in admin
    localStorage.setItem(
      'slq_admin_user',
      JSON.stringify({
        id: 'admin-001',
        username: 'admin',
        email: 'admin@taphoaacc.com',
        role: 'admin',
      }),
    );

    localStorage.setItem(
      'slq_users',
      JSON.stringify([
        {
          id: 'admin-001',
          username: 'admin',
          email: 'admin@taphoaacc.com',
          password: 'admin',
          balance: 999999999,
          role: 'admin',
          referralCode: 'ADMIN001',
          referredBy: '',
          discount: 0,
          createdAt: '2026-01-01',
        },
        {
          id: 'user-001',
          username: 'member',
          email: 'member@example.com',
          password: '***',
          balance: 100000,
          role: 'user',
          referralCode: 'REF001',
          referredBy: '',
          discount: 0,
          createdAt: '2026-03-01',
        },
      ]),
    );

    localStorage.setItem(
      'slq_recharges',
      JSON.stringify([
        {
          id: 'RCH-1',
          userId: 'user-001',
          username: 'member',
          amount: 50000,
          method: 'bank',
          note: 'test recharge',
          date: new Date().toISOString(),
          status: 'pending',
        },
      ]),
    );
  });

  it('approves recharge and increases target user balance', async () => {
    render(
      <AuthProvider>
        <AdminHarness />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText('approve-recharge'));

    await waitFor(() => {
      const recharges = JSON.parse(localStorage.getItem('slq_recharges') || '[]');
      const users = JSON.parse(localStorage.getItem('slq_users') || '[]');

      expect(recharges[0].status).toBe('approved');
      expect(users.find((u: { id: string; balance: number }) => u.id === 'user-001')?.balance).toBe(150000);
    });
  });

  it('updates user role/discount/balance from admin action', async () => {
    render(
      <AuthProvider>
        <AdminHarness />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText('update-user'));

    await waitFor(() => {
      const users = JSON.parse(localStorage.getItem('slq_users') || '[]');
      const updated = users.find((u: { id: string }) => u.id === 'user-001');

      expect(updated?.role).toBe('admin');
      expect(updated?.discount).toBe(15);
      expect(updated?.balance).toBe(123000);
    });
  });
});
