/**
 * Custom hook for localStorage products with SSR safety
 */

import { useSyncExternalStore } from 'react';
import { Product, products as defaultProducts } from '@/lib/data';
import { PRODUCTS_OVERRIDE_KEY } from './constants';

let cachedProductsRaw: string | null = null;
let cachedProductsSnapshot: Product[] = defaultProducts;

function subscribeProductsOverride() {
  return () => {};
}

function getProductsServerSnapshot(): Product[] {
  return defaultProducts;
}

function getProductsClientSnapshot(): Product[] {
  if (typeof window === 'undefined') return defaultProducts;
  
  try {
    const raw = localStorage.getItem(PRODUCTS_OVERRIDE_KEY);
    if (raw === cachedProductsRaw) return cachedProductsSnapshot;
    
    cachedProductsRaw = raw;
    cachedProductsSnapshot = raw ? JSON.parse(raw) : defaultProducts;
    return cachedProductsSnapshot;
  } catch {
    return defaultProducts;
  }
}

export function useLocalProducts(): Product[] {
  return useSyncExternalStore(
    subscribeProductsOverride,
    getProductsClientSnapshot,
    getProductsServerSnapshot
  );
}
