/**
 * Data Migration - localStorage to PostgreSQL
 * Migrates users, orders, and transactions from localStorage JSON to database
 */

import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { deobfuscate } from './security';

// ─── Constants ─────────────────────────────────────────────────────────────────

const BCRYPT_SALT_ROUNDS = 10;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LocalStorageUser {
  id: string;
  username: string;
  email: string;
  password: string;
  balance: number;
  role: 'user' | 'admin';
  referralCode: string;
  referredBy: string;
  discount: number;
  createdAt: string;
  spinTickets?: number;
}

interface LocalStorageOrder {
  id: string;
  userId: string;
  productName: string;
  productId: number;
  accountData: string;
  amount: number;
  date: string;
  status: 'success' | 'pending' | 'failed';
}

interface LocalStorageTransaction {
  id: string;
  userId: string;
  type: 'recharge' | 'purchase' | 'referral' | 'spin';
  amount: number;
  description: string;
  date: string;
  status: 'success' | 'pending';
}

interface MigrationResult {
  success: number;
  failed: number;
  errors: string[];
}

type MigrationCallback<T> = (item: T) => Promise<void>;

// ─── Generic Migration Helper ──────────────────────────────────────────────────

async function migrateItems<T extends { id?: string }>(
  items: T[],
  entityName: string,
  migrateOne: MigrationCallback<T>
): Promise<MigrationResult> {
  console.log(`Migrating ${items.length} ${entityName}...`);

  const result: MigrationResult = { success: 0, failed: 0, errors: [] };

  for (const item of items) {
    try {
      await migrateOne(item);
      result.success++;
    } catch (error) {
      result.failed++;
      const identifier = item.id || 'unknown';
      result.errors.push(`${entityName} ${identifier}: ${error}`);
    }
  }

  console.log(`${entityName} migration: ${result.success} success, ${result.failed} failed`);

  if (result.errors.length > 0) {
    console.error('Errors:', result.errors);
  }

  return result;
}

// ─── Individual Item Migrations ────────────────────────────────────────────────

async function migrateOneUser(user: LocalStorageUser): Promise<void> {
  const plainPassword = deobfuscate(user.password);
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);

  await prisma.user.create({
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash,
      role: user.role,
      balance: user.balance,
      referralCode: user.referralCode,
      referredBy: user.referredBy || null,
      discount: user.discount,
      spinTickets: user.spinTickets || 0,
      createdAt: new Date(user.createdAt),
    },
  });
}

async function migrateOneOrder(order: LocalStorageOrder): Promise<void> {
  await prisma.order.create({
    data: {
      id: order.id,
      userId: order.userId,
      productId: order.productId,
      productName: order.productName,
      accountData: order.accountData,
      amount: order.amount,
      status: order.status,
      createdAt: new Date(order.date),
    },
  });
}

async function migrateOneTransaction(transaction: LocalStorageTransaction): Promise<void> {
  await prisma.transaction.create({
    data: {
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status,
      createdAt: new Date(transaction.date),
    },
  });
}

// ─── Public Migration Functions ────────────────────────────────────────────────

export function migrateUsers(users: LocalStorageUser[]): Promise<MigrationResult> {
  return migrateItems(users, 'users', migrateOneUser);
}

export function migrateOrders(orders: LocalStorageOrder[]): Promise<MigrationResult> {
  return migrateItems(orders, 'orders', migrateOneOrder);
}

export function migrateTransactions(transactions: LocalStorageTransaction[]): Promise<MigrationResult> {
  return migrateItems(transactions, 'transactions', migrateOneTransaction);
}

// ─── Export/Import Utilities ───────────────────────────────────────────────────

interface ExportedData {
  users: LocalStorageUser[];
  orders: LocalStorageOrder[];
  transactions: LocalStorageTransaction[];
  pendingRecharges: unknown[];
  accountStocks: unknown[];
  exportedAt: string;
}

const LOCALSTORAGE_KEYS = {
  users: 'slq_users',
  orders: 'slq_orders',
  transactions: 'slq_transactions',
  pendingRecharges: 'slq_pending_recharges',
  accountStocks: 'slq_account_stocks',
} as const;

function parseLocalStorageJson<T>(key: string): T[] {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

/** Export all localStorage data to JSON (browser only) */
export function exportLocalStorageData(): ExportedData | null {
  if (typeof window === 'undefined') {
    console.error('exportLocalStorageData must run in browser context');
    return null;
  }

  return {
    users: parseLocalStorageJson(LOCALSTORAGE_KEYS.users),
    orders: parseLocalStorageJson(LOCALSTORAGE_KEYS.orders),
    transactions: parseLocalStorageJson(LOCALSTORAGE_KEYS.transactions),
    pendingRecharges: parseLocalStorageJson(LOCALSTORAGE_KEYS.pendingRecharges),
    accountStocks: parseLocalStorageJson(LOCALSTORAGE_KEYS.accountStocks),
    exportedAt: new Date().toISOString(),
  };
}

// ─── Full Migration Runner ─────────────────────────────────────────────────────

interface MigrationData {
  users: LocalStorageUser[];
  orders: LocalStorageOrder[];
  transactions: LocalStorageTransaction[];
}

interface MigrationSummary {
  users: MigrationResult;
  orders: MigrationResult;
  transactions: MigrationResult;
}

/** Run complete migration (Node.js context) */
export async function runMigration(data: MigrationData): Promise<MigrationSummary> {
  console.log('Starting migration...');

  const userResults = await migrateUsers(data.users);
  const orderResults = await migrateOrders(data.orders);
  const transactionResults = await migrateTransactions(data.transactions);

  const summary: MigrationSummary = {
    users: userResults,
    orders: orderResults,
    transactions: transactionResults,
  };

  console.log('\n=== MIGRATION SUMMARY ===');
  console.log('Users:', summary.users);
  console.log('Orders:', summary.orders);
  console.log('Transactions:', summary.transactions);
  console.log('========================\n');

  return summary;
}
