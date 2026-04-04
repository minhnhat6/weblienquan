/**
 * Core type definitions for ShopLienQuan
 * Single source of truth for all shared interfaces
 */

// ─── Product & Category Types ──────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  categoryId: number;
  totalStock: number;
  soldCount: number;
  isHot: boolean;
  discount: number;
  // Game-specific stats (optional, filled by admin)
  winRate?: number;
  totalGold?: number;
  totalMatches?: number;
  heroes?: number;
  skins?: number;
  gems?: number;
  rank?: string;
  heroImages?: string[];
  skinImages?: string[];
  gemImages?: string[];
}

export interface AccountStock {
  id: number;
  productId: number;
  accountData: string;
  isSold: boolean;
}

// ─── Order & Transaction Types ─────────────────────────────────────────────────

export type OrderStatus = 'success' | 'pending' | 'failed';
export type TransactionType = 'recharge' | 'purchase' | 'referral' | 'spin';
export type TransactionStatus = 'success' | 'pending';

export interface Order {
  id: string;
  userId: string;
  productName: string;
  productId: number;
  accountData: string;
  amount: number;
  date: string;
  status: OrderStatus;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  status: TransactionStatus;
}

// ─── User Types ────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  balance: number;
  role: UserRole;
  referralCode: string;
  referredBy: string;
  discount: number;
  createdAt: string;
  spinTickets?: number;
}

// ─── Content Types ─────────────────────────────────────────────────────────────

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  author?: string;
  category?: string;
}

export interface SpinReward {
  id: number;
  name: string;
  amount: number;
  color: string;
}

export interface RecentActivity {
  user: string;
  product: string;
  price: number;
  time: string;
}

// ─── Admin Types ───────────────────────────────────────────────────────────────

export type RechargeStatus = 'pending' | 'approved' | 'rejected';
export type ConsignmentStatus = 'pending' | 'approved' | 'rejected' | 'sold';

export interface PendingRecharge {
  id: string;
  userId: string;
  username: string;
  amount: number;
  method: string;
  note: string;
  date: string;
  status: RechargeStatus;
}

export interface AccountStockItem {
  id: string;
  productId: number;
  productName: string;
  accountData: string;
  isSold: boolean;
  soldDate?: string;
  soldOrderId?: string;
}

export interface ConsignmentItem {
  id: string;
  userId: string;
  username: string;
  title: string;
  description: string;
  categoryName: string;
  accountData: string;
  askPrice: number;
  salePrice: number;
  feePercent: number;
  images: string;
  status: ConsignmentStatus;
  rejectReason?: string;
  submitDate: string;
  soldDate?: string;
  soldAmount?: number;
}

// ─── Observability Types ───────────────────────────────────────────────────────

export type BusinessEventType =
  | 'order.created'
  | 'recharge.requested'
  | 'recharge.approved'
  | 'recharge.rejected'
  | 'user.updated'
  | 'user.deleted'
  | 'upload.completed'
  | 'upload.rejected';

export type ClientErrorType = 'window.error' | 'unhandledrejection' | 'http.error';

export interface BusinessLogEvent {
  id: string;
  ts: string;
  type: BusinessEventType;
  actorId?: string;
  actorName?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}

export interface ClientErrorEvent {
  id: string;
  ts: string;
  type: ClientErrorType;
  message: string;
  stack?: string;
  route?: string;
  meta?: Record<string, unknown>;
}

export interface PerfEvent {
  id: string;
  ts: string;
  kind: 'http';
  path: string;
  method: string;
  status: number;
  ok: boolean;
  durationMs: number;
}

// ─── Reconciliation Types ──────────────────────────────────────────────────────

export type ReconciliationIssueType = 'purchase-mismatch' | 'recharge-mismatch' | 'negative-balance';

export interface RechargeRecord {
  id: string;
  userId: string;
  amount: number;
  status: RechargeStatus;
}

export interface ReconciliationInput {
  users: User[];
  orders: Order[];
  transactions: Transaction[];
  recharges: RechargeRecord[];
}

export interface ReconciliationIssue {
  type: ReconciliationIssueType;
  userId?: string;
  details: string;
}

export interface ReconciliationReport {
  generatedAt: string;
  totals: {
    successfulOrders: number;
    successfulPurchasesAmount: number;
    approvedRechargesAmount: number;
    rechargeTransactionsAmount: number;
  };
  issues: ReconciliationIssue[];
}

// ─── Backup Types ──────────────────────────────────────────────────────────────

export interface BackupSnapshot {
  version: 1;
  createdAt: string;
  source: 'slq-localstorage';
  keys: Record<string, string>;
}

// ─── Session Types ─────────────────────────────────────────────────────────────

export interface AdminSessionPayload {
  sub: string;
  username: string;
  role: 'admin';
  exp: number;
}
