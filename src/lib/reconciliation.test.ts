import { describe, expect, it } from 'vitest';
import { runReconciliation } from '@/lib/reconciliation';

describe('runReconciliation', () => {
  it('returns no issues when data is consistent', () => {
    const report = runReconciliation({
      users: [
        {
          id: 'u1',
          username: 'user1',
          email: 'u1@example.com',
          password: '***',
          balance: 1000,
          role: 'user',
          referralCode: 'REF1',
          referredBy: '',
          discount: 0,
          createdAt: '2026-03-01',
        },
      ],
      orders: [
        {
          id: 'o1',
          userId: 'u1',
          productName: 'P1',
          productId: 1,
          accountData: 'acc',
          amount: 200,
          date: new Date().toISOString(),
          status: 'success',
        },
      ],
      transactions: [
        {
          id: 't1',
          userId: 'u1',
          type: 'purchase',
          amount: -200,
          description: 'buy',
          date: new Date().toISOString(),
          status: 'success',
        },
        {
          id: 't2',
          userId: 'u1',
          type: 'recharge',
          amount: 500,
          description: 'rech',
          date: new Date().toISOString(),
          status: 'success',
        },
      ],
      recharges: [
        {
          id: 'r1',
          userId: 'u1',
          amount: 500,
          status: 'approved',
        },
      ],
    });

    expect(report.issues).toHaveLength(0);
  });

  it('detects mismatches and negative balance', () => {
    const report = runReconciliation({
      users: [
        {
          id: 'u2',
          username: 'user2',
          email: 'u2@example.com',
          password: '***',
          balance: -10,
          role: 'user',
          referralCode: 'REF2',
          referredBy: '',
          discount: 0,
          createdAt: '2026-03-01',
        },
      ],
      orders: [
        {
          id: 'o2',
          userId: 'u2',
          productName: 'P2',
          productId: 2,
          accountData: 'acc',
          amount: 300,
          date: new Date().toISOString(),
          status: 'success',
        },
      ],
      transactions: [],
      recharges: [],
    });

    expect(report.issues.some(i => i.type === 'purchase-mismatch')).toBe(true);
    expect(report.issues.some(i => i.type === 'negative-balance')).toBe(true);
  });
});
