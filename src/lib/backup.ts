/**
 * Backup and restore functionality for localStorage data
 * Creates JSON snapshots of all slq_* keys
 */

import type { BackupSnapshot } from './types';

// Re-export type for backwards compatibility
export type { BackupSnapshot };

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'slq_';
const BACKUP_VERSION = 1;
const BACKUP_SOURCE = 'slq-localstorage' as const;

// ─── Helper Functions ──────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function createEmptySnapshot(): BackupSnapshot {
  return {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    source: BACKUP_SOURCE,
    keys: {},
  };
}

function getAllStorageKeys(): string[] {
  if (!isBrowser()) return [];

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/** Create a backup snapshot of all slq_* localStorage keys */
export function createBackupSnapshot(): BackupSnapshot {
  if (!isBrowser()) return createEmptySnapshot();

  const keys: Record<string, string> = {};

  getAllStorageKeys().forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      keys[key] = value;
    }
  });

  return {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    source: BACKUP_SOURCE,
    keys,
  };
}

/** Validate that a payload is a valid BackupSnapshot */
export function validateBackupSnapshot(payload: unknown): payload is BackupSnapshot {
  if (!payload || typeof payload !== 'object') return false;

  const data = payload as Partial<BackupSnapshot>;

  return (
    data.version === BACKUP_VERSION &&
    typeof data.createdAt === 'string' &&
    data.source === BACKUP_SOURCE &&
    data.keys !== null &&
    typeof data.keys === 'object'
  );
}

/** Restore a backup snapshot, replacing all slq_* keys */
export function restoreBackupSnapshot(
  snapshot: BackupSnapshot
): { restored: number; removed: number } {
  if (!isBrowser()) return { restored: 0, removed: 0 };

  // Remove existing slq_* keys
  const existingKeys = getAllStorageKeys();
  existingKeys.forEach(key => localStorage.removeItem(key));
  const removed = existingKeys.length;

  // Restore keys from snapshot
  let restored = 0;
  Object.entries(snapshot.keys).forEach(([key, value]) => {
    if (key.startsWith(STORAGE_KEY_PREFIX)) {
      localStorage.setItem(key, value);
      restored++;
    }
  });

  return { restored, removed };
}
