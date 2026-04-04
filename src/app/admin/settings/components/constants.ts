/**
 * Admin Settings Constants and Types
 */
import { Settings } from '@/lib/settings';

export const STORAGE_KEY = 'slq_site_settings';

export const TABS = [
  { id: 'general', label: '⚙️ Chung' },
  { id: 'bank', label: '🏦 Ngân Hàng' },
  { id: 'hero', label: '🏠 Banner' },
  { id: 'spin', label: '🎡 Vòng Quay' },
  { id: 'ops', label: '📟 Vận Hành' },
] as const;

export type TabId = typeof TABS[number]['id'];

export const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '9px 14px',
  background: '#111827',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: 8,
  color: '#e8eaed',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
};

export const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#9ca3af',
  marginBottom: 6,
  fontWeight: 600,
};

export const BUTTON_STYLES = {
  save: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: 8,
    color: 'white',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  tab: (active: boolean): React.CSSProperties => ({
    padding: '9px 18px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    background: active 
      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
      : 'rgba(99,102,241,0.1)',
    color: active ? 'white' : '#9ca3af',
  }),
  ops: (color: string): React.CSSProperties => ({
    padding: '9px 14px',
    background: `${color}25`,
    border: `1px solid ${color}60`,
    borderRadius: 8,
    color: color,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }),
};

/** Tab panel content props */
export interface TabPanelProps {
  settings: Settings;
  onUpdate: (key: keyof Settings, value: unknown) => void;
}
