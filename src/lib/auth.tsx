'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  User,
  Order,
  Transaction,
  PendingRecharge,
  AccountStockItem,
  ConsignmentItem,
} from '@/lib/types';

// Re-export admin types for backwards compatibility
export type { PendingRecharge, AccountStockItem, ConsignmentItem } from '@/lib/types';

// ─── Toast Types ───────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: string;
}

// ─── Context Interface ─────────────────────────────────────────────────────────

interface AuthContextType {
  // User state
  user: User | null;
  adminUser: User | null;
  loading: boolean;

  // Auth actions
  login: (username: string, password: string) => Promise<boolean>;
  loginAdmin: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, referralCode?: string) => Promise<boolean>;
  logout: () => void;
  logoutAdmin: () => void;

  // User data
  updateBalance: (amount: number) => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;

  // Toast notifications
  showToast: (message: string, type: ToastType) => void;
  toasts: Toast[];

  // Spin feature
  getSpinTickets: () => number;
  addSpinTicket: () => void;
  consumeSpinTicket: () => boolean;

  // Legacy admin functions (deprecated - use admin APIs)
  getAllUsers: () => User[];
  updateUser: (userId: string, changes: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  getAllOrders: () => Order[];
  getAllTransactions: () => Transaction[];
  getAccountStock: (productId?: number) => AccountStockItem[];
  addAccountStock: (items: AccountStockItem[]) => void;
  deleteAccountStock: (id: string) => void;
  getPendingRecharges: () => PendingRecharge[];
  addPendingRecharge: (r: PendingRecharge) => void;
  approveRecharge: (id: string) => void;
  rejectRecharge: (id: string) => void;
  getConsignments: (userId?: string) => ConsignmentItem[];
  submitConsignment: (item: Omit<ConsignmentItem, 'id' | 'status' | 'submitDate' | 'feePercent' | 'salePrice'>) => void;
  updateConsignment: (id: string, changes: Partial<ConsignmentItem>) => void;
  deleteConsignment: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Constants ─────────────────────────────────────────────────────────────────

const TOAST_DURATION_MS = 3000;
const API_ENDPOINTS = {
  me: '/api/auth/me',
  login: '/api/auth/login',
  adminSession: '/api/auth/admin-session',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  orders: '/api/orders',
  transactions: '/api/transactions',
} as const;

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ─── API Helpers ─────────────────────────────────────────────────────────────

  async function fetchJson<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const res = await fetch(url, { credentials: 'include', ...options });
      return await res.json();
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      return { success: false, error: 'Network error' };
    }
  }

  // ─── Data Fetching ───────────────────────────────────────────────────────────

  async function fetchOrders() {
    const result = await fetchJson<{ orders: Order[] }>(API_ENDPOINTS.orders);
    if (result.success && result.data) {
      setOrders(result.data.orders);
    }
  }

  async function fetchTransactions() {
    const result = await fetchJson<{ transactions: Transaction[] }>(API_ENDPOINTS.transactions);
    if (result.success && result.data) {
      setTransactions(result.data.transactions);
    }
  }

  async function fetchCurrentUser() {
    const result = await fetchJson<{ user: User }>(API_ENDPOINTS.me);
    if (result.success && result.data) {
      setUser(result.data.user);
      // Fetch related data after user is set
      void fetchOrders();
      void fetchTransactions();
    }
    setLoading(false);
  }

  useEffect(() => {
    void fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Toast Management ────────────────────────────────────────────────────────

  function showToast(message: string, type: ToastType) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, TOAST_DURATION_MS);
  }

  // ─── Auth Actions ────────────────────────────────────────────────────────────

  async function login(username: string, password: string): Promise<boolean> {
    const result = await fetchJson<{ user: User }>(API_ENDPOINTS.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (result.success && result.data) {
      setUser(result.data.user);
      showToast('Đăng nhập thành công!', 'success');
      fetchOrders();
      fetchTransactions();
      return true;
    }

    showToast(result.error || 'Đăng nhập thất bại!', 'error');
    return false;
  }

  async function loginAdmin(username: string, password: string): Promise<boolean> {
    const result = await fetchJson<{ user: User }>(API_ENDPOINTS.adminSession, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (result.success && result.data) {
      setAdminUser(result.data.user);
      showToast('Đăng nhập admin thành công!', 'success');
      return true;
    }

    showToast(result.error || 'Đăng nhập admin thất bại!', 'error');
    return false;
  }

  async function register(
    username: string,
    email: string,
    password: string,
    referralCode?: string
  ): Promise<boolean> {
    const result = await fetchJson(API_ENDPOINTS.register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, referredBy: referralCode }),
    });

    if (result.success) {
      showToast('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
      return true;
    }

    showToast(result.error || 'Đăng ký thất bại!', 'error');
    return false;
  }

  async function logout() {
    await fetchJson(API_ENDPOINTS.logout, { method: 'POST' });
    setUser(null);
    setOrders([]);
    setTransactions([]);
    showToast('Đã đăng xuất', 'info');
  }

  function logoutAdmin() {
    setAdminUser(null);
    showToast('Đã đăng xuất admin', 'info');
  }

  // ─── User Data Actions ───────────────────────────────────────────────────────

  function updateBalance(amount: number) {
    if (user) {
      setUser({ ...user, balance: Number(user.balance) + amount });
    }
  }

  function addOrder(order: Order) {
    setOrders(prev => [order, ...prev]);
  }

  function addTransaction(tx: Transaction) {
    setTransactions(prev => [tx, ...prev]);
  }

  // ─── Spin Feature ────────────────────────────────────────────────────────────

  function getSpinTickets(): number {
    return user?.spinTickets || 0;
  }

  function addSpinTicket() {
    if (user) {
      setUser({ ...user, spinTickets: (user.spinTickets || 0) + 1 });
    }
  }

  function consumeSpinTicket(): boolean {
    if (user && (user.spinTickets || 0) > 0) {
      setUser({ ...user, spinTickets: (user.spinTickets || 0) - 1 });
      return true;
    }
    return false;
  }

  // ─── Legacy Admin Functions (deprecated - kept for backwards compatibility) ──

  const getAllUsers = (): User[] => [];
  const updateUser = (_userId: string, _changes: Partial<User>) => {};
  const deleteUser = (_userId: string) => {};
  const getAllOrders = (): Order[] => orders;
  const getAllTransactions = (): Transaction[] => transactions;
  const getAccountStock = (_productId?: number): AccountStockItem[] => [];
  const addAccountStock = (_items: AccountStockItem[]) => {};
  const deleteAccountStock = (_id: string) => {};
  const getPendingRecharges = (): PendingRecharge[] => [];
  const addPendingRecharge = (_r: PendingRecharge) => {};
  const approveRecharge = (_id: string) => {};
  const rejectRecharge = (_id: string) => {};
  const getConsignments = (_userId?: string): ConsignmentItem[] => [];
  const submitConsignment = (_item: Omit<ConsignmentItem, 'id' | 'status' | 'submitDate' | 'feePercent' | 'salePrice'>) => {};
  const updateConsignment = (_id: string, _changes: Partial<ConsignmentItem>) => {};
  const deleteConsignment = (_id: string) => {};

  // ─── Context Value ───────────────────────────────────────────────────────────

  const value: AuthContextType = {
    user,
    adminUser,
    loading,
    login,
    loginAdmin,
    register,
    logout,
    logoutAdmin,
    updateBalance,
    orders,
    addOrder,
    transactions,
    addTransaction,
    showToast,
    toasts,
    getSpinTickets,
    addSpinTicket,
    consumeSpinTicket,
    // Legacy admin functions
    getAllUsers,
    updateUser,
    deleteUser,
    getAllOrders,
    getAllTransactions,
    getAccountStock,
    addAccountStock,
    deleteAccountStock,
    getPendingRecharges,
    addPendingRecharge,
    approveRecharge,
    rejectRecharge,
    getConsignments,
    submitConsignment,
    updateConsignment,
    deleteConsignment,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
