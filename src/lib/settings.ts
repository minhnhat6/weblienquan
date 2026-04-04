/**
 * Site Settings - Configuration and customization
 * Manages shop settings like contact info, payment details, and spin rewards
 */

'use client';

import { useState } from 'react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const SETTINGS_STORAGE_KEY = 'slq_site_settings';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SpinRewardConfig {
  label: string;
  amount: number;
  color: string;
}

interface SiteSettings {
  siteName: string;
  hotline: string;
  zaloLink: string;
  facebookLink: string;
  bankName: string;
  bankAccount: string;
  bankOwner: string;
  heroTitle: string;
  heroSubtitle: string;
  spinCost: number;
  spinRewards: SpinRewardConfig[];
}

// ─── Default Settings ──────────────────────────────────────────────────────────

export const defaultSettings: SiteSettings = {
  siteName: 'Tạp Hóa ACC',
  hotline: '0334 622 902',
  zaloLink: 'https://zalo.me/0334622902',
  facebookLink: 'https://facebook.com',
  bankName: 'MB Bank',
  bankAccount: '1234567890',
  bankOwner: 'THAI VAN HIEU',
  heroTitle: 'RANDOM ACC LIÊN QUÂN',
  heroSubtitle: 'GIÁ RẺ - UY TÍN - CHẤT LƯỢNG',
  spinCost: 500,
  spinRewards: [
    { label: 'ACC 0đ', amount: 0, color: '#6366f1' },
    { label: '500đ', amount: 500, color: '#f59e0b' },
    { label: '1,000đ', amount: 1000, color: '#10b981' },
    { label: 'Thất bại', amount: 0, color: '#4b5563' },
    { label: '2,000đ', amount: 2000, color: '#ef4444' },
    { label: '5,000đ', amount: 5000, color: '#8b5cf6' },
    { label: '10,000đ', amount: 10000, color: '#06b6d4' },
    { label: 'Thất bại', amount: 0, color: '#374151' },
  ],
};

export type Settings = typeof defaultSettings;

// ─── Hook ──────────────────────────────────────────────────────────────────────

function loadSettingsFromStorage(): SiteSettings {
  if (typeof window === 'undefined') return defaultSettings;

  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!saved) return defaultSettings;

  try {
    return { ...defaultSettings, ...JSON.parse(saved) };
  } catch {
    return defaultSettings;
  }
}

export function useSiteSettings() {
  const [settings] = useState<SiteSettings>(loadSettingsFromStorage);
  const isLoaded = typeof window !== 'undefined';

  return { settings, loaded: isLoaded };
}
