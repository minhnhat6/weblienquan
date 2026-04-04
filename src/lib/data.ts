/**
 * Data Layer - Helpers and re-exports
 * Types are defined in ./types.ts, mock data in ./mock-data.ts
 */

import { randomBytes } from 'crypto';
import type { Product } from './types';
import { products } from './mock-data';

// Re-export types for backwards compatibility
export type {
  Category,
  Product,
  AccountStock,
  Order,
  Transaction,
  User,
  BlogPost,
  SpinReward,
} from './types';

// Re-export mock data for backwards compatibility
export {
  categories,
  products,
  spinRewards,
  blogPosts,
  recentActivities,
} from './mock-data';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ACCOUNT_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ACCOUNT_USERNAME_LENGTH = 8;
const ACCOUNT_PASSWORD_LENGTH = 10;
const DEFAULT_SERVER = 'Garena VN';
const LOCALE_VN = 'vi-VN';
const CURRENCY_SUFFIX = 'đ';
const FREE_LABEL = 'Miễn phí';
const ALL_PRODUCTS_CATEGORY_ID = 0;

// ─── Account Generation ────────────────────────────────────────────────────────

/** Generate a cryptographically secure random string of specified length */
function generateSecureRandomString(length: number, chars: string): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map(byte => chars[byte % chars.length])
    .join('');
}

/** Generate mock account credentials for demo purposes */
export function generateAccountData(): string {
  const username = generateSecureRandomString(ACCOUNT_USERNAME_LENGTH, ACCOUNT_CHARS);
  const password = generateSecureRandomString(ACCOUNT_PASSWORD_LENGTH, ACCOUNT_CHARS);
  return `Tài khoản: ${username}@gmail.com\nMật khẩu: ${password}\nServer: ${DEFAULT_SERVER}`;
}

// ─── Price Formatting ──────────────────────────────────────────────────────────

/** Format price for balance/transactions - always shows numeric value */
export function formatPrice(price: number): string {
  return price.toLocaleString(LOCALE_VN) + CURRENCY_SUFFIX;
}

/** Format price for products - shows "Miễn phí" for free items */
export function formatProductPrice(price: number): string {
  return price === 0 ? FREE_LABEL : formatPrice(price);
}

// ─── Product Queries ───────────────────────────────────────────────────────────

/** Get products filtered by category (0 = all) */
export function getProductsByCategory(categoryId: number): Product[] {
  if (categoryId === ALL_PRODUCTS_CATEGORY_ID) return products;
  return products.filter(p => p.categoryId === categoryId);
}
