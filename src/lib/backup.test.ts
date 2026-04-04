import { beforeEach, describe, expect, it } from 'vitest';
import { createBackupSnapshot, restoreBackupSnapshot, validateBackupSnapshot } from '@/lib/backup';

describe('backup snapshot', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates snapshot only for slq_* keys', () => {
    localStorage.setItem('slq_users', '[1]');
    localStorage.setItem('slq_orders', '[2]');
    localStorage.setItem('other_key', 'ignore');

    const snapshot = createBackupSnapshot();

    expect(snapshot.version).toBe(1);
    expect(Object.keys(snapshot.keys)).toEqual(expect.arrayContaining(['slq_users', 'slq_orders']));
    expect(snapshot.keys.other_key).toBeUndefined();
  });

  it('restores snapshot and removes old slq keys', () => {
    localStorage.setItem('slq_users', '[old]');
    localStorage.setItem('slq_orders', '[old]');

    const result = restoreBackupSnapshot({
      version: 1,
      createdAt: new Date().toISOString(),
      source: 'slq-localstorage',
      keys: {
        slq_users: '[new-users]',
        slq_recharges: '[new-recharges]',
      },
    });

    expect(result.removed).toBe(2);
    expect(result.restored).toBe(2);
    expect(localStorage.getItem('slq_users')).toBe('[new-users]');
    expect(localStorage.getItem('slq_orders')).toBeNull();
    expect(localStorage.getItem('slq_recharges')).toBe('[new-recharges]');
  });

  it('validates backup payload shape', () => {
    expect(validateBackupSnapshot({
      version: 1,
      createdAt: new Date().toISOString(),
      source: 'slq-localstorage',
      keys: {},
    })).toBe(true);

    expect(validateBackupSnapshot({ version: 2 })).toBe(false);
    expect(validateBackupSnapshot(null)).toBe(false);
  });
});
