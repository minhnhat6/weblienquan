/**
 * Financial reconciliation for ShopLienQuan
 * Validates consistency between orders, transactions, recharges, and user balances
 */

import type {
  Order,
  Transaction,
  User,
  RechargeRecord,
  ReconciliationInput,
  ReconciliationIssue,
  ReconciliationReport,
} from './types';

// Re-export types for backwards compatibility
export type { RechargeRecord, ReconciliationInput, ReconciliationIssue, ReconciliationReport };

// ─── Helper Functions ──────────────────────────────────────────────────────────

type AmountMap = Record<string, number>;

/** Sum amounts by userId into a map */
function sumByUserId<T extends { userId: string }>(
  items: T[],
  getAmount: (item: T) => number
): AmountMap {
  return items.reduce<AmountMap>((acc, item) => {
    acc[item.userId] = (acc[item.userId] || 0) + getAmount(item);
    return acc;
  }, {});
}

/** Get all unique user IDs from multiple maps and arrays */
function collectUserIds(maps: AmountMap[], users: User[]): Set<string> {
  const ids = new Set<string>();

  maps.forEach(map => Object.keys(map).forEach(id => ids.add(id)));
  users.forEach(u => ids.add(u.id));

  return ids;
}

/** Check for mismatch between two amounts for a user */
function checkMismatch(
  userId: string,
  amount1: number,
  amount2: number,
  issueType: ReconciliationIssue['type'],
  label1: string,
  label2: string
): ReconciliationIssue | null {
  if (amount1 !== amount2) {
    return {
      type: issueType,
      userId,
      details: `${label1} (${amount1}) != ${label2} (${amount2})`,
    };
  }
  return null;
}

// ─── Main Reconciliation Function ──────────────────────────────────────────────

/**
 * Run financial reconciliation across all data
 * Checks:
 * 1. Order amounts match purchase transaction amounts per user
 * 2. Approved recharge amounts match recharge transaction amounts per user
 * 3. No users have negative balances
 */
export function runReconciliation(input: ReconciliationInput): ReconciliationReport {
  const { users, orders, transactions, recharges } = input;

  // Filter by status
  const successfulOrders = orders.filter(o => o.status === 'success');
  const purchaseTransactions = transactions.filter(t => t.type === 'purchase' && t.status === 'success');
  const rechargeTransactions = transactions.filter(t => t.type === 'recharge' && t.status === 'success');
  const approvedRecharges = recharges.filter(r => r.status === 'approved');

  // Build amount maps by userId
  const orderAmountsByUser = sumByUserId(successfulOrders, o => o.amount);
  const purchaseAmountsByUser = sumByUserId(purchaseTransactions, t => Math.abs(t.amount));
  const approvedRechargesByUser = sumByUserId(approvedRecharges, r => r.amount);
  const rechargeTransactionsByUser = sumByUserId(rechargeTransactions, t => Math.abs(t.amount));

  // Collect all user IDs
  const allUserIds = collectUserIds(
    [orderAmountsByUser, purchaseAmountsByUser, approvedRechargesByUser, rechargeTransactionsByUser],
    users
  );

  // Find issues
  const issues: ReconciliationIssue[] = [];

  for (const userId of allUserIds) {
    const orderAmount = orderAmountsByUser[userId] || 0;
    const purchaseAmount = purchaseAmountsByUser[userId] || 0;
    const approvedAmount = approvedRechargesByUser[userId] || 0;
    const rechargeAmount = rechargeTransactionsByUser[userId] || 0;

    // Check purchase mismatch
    const purchaseIssue = checkMismatch(
      userId,
      orderAmount,
      purchaseAmount,
      'purchase-mismatch',
      'Order success total',
      'purchase transaction total'
    );
    if (purchaseIssue) issues.push(purchaseIssue);

    // Check recharge mismatch
    const rechargeIssue = checkMismatch(
      userId,
      approvedAmount,
      rechargeAmount,
      'recharge-mismatch',
      'Approved recharge total',
      'recharge transaction total'
    );
    if (rechargeIssue) issues.push(rechargeIssue);
  }

  // Check for negative balances
  for (const user of users) {
    if (user.balance < 0) {
      issues.push({
        type: 'negative-balance',
        userId: user.id,
        details: `User ${user.username} has negative balance: ${user.balance}`,
      });
    }
  }

  // Calculate totals
  const totalOrderAmount = successfulOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalApprovedRecharges = approvedRecharges.reduce((sum, r) => sum + r.amount, 0);
  const totalRechargeTransactions = rechargeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      successfulOrders: successfulOrders.length,
      successfulPurchasesAmount: totalOrderAmount,
      approvedRechargesAmount: totalApprovedRecharges,
      rechargeTransactionsAmount: totalRechargeTransactions,
    },
    issues,
  };
}
