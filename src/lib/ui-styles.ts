/**
 * Common UI Styles
 * Reusable style objects for consistent UI across the app
 */

import { CSSProperties } from 'react';

// ─── Color Palette ─────────────────────────────────────────────────────────────

export const colors = {
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#6366f1',
  
  // Background variants
  successBg: 'rgba(16,185,129,0.12)',
  warningBg: 'rgba(245,158,11,0.12)',
  errorBg: 'rgba(239,68,68,0.12)',
  infoBg: 'rgba(99,102,241,0.12)',
} as const;

// ─── Card Styles ───────────────────────────────────────────────────────────────

export const cardStyle: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  padding: 16,
};

export const cardHoverStyle: CSSProperties = {
  ...cardStyle,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
};

export const glassCardStyle: CSSProperties = {
  background: 'var(--bg-glass)',
  backdropFilter: 'blur(10px)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  padding: 16,
};

// ─── Button Styles ─────────────────────────────────────────────────────────────

export const baseButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 20px',
  borderRadius: 'var(--radius)',
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export const primaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  background: 'var(--gradient-primary)',
  color: 'white',
};

export const secondaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
};

export const dangerButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  background: colors.error,
  color: 'white',
};

export const successButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  background: colors.success,
  color: 'white',
};

export const ghostButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  background: 'transparent',
  color: 'var(--text-primary)',
  padding: '8px 12px',
};

export const disabledButtonStyle: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

// ─── Input Styles ──────────────────────────────────────────────────────────────

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 100,
  resize: 'vertical',
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

// ─── Label Styles ──────────────────────────────────────────────────────────────

export const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-secondary)',
};

export const requiredLabelStyle: CSSProperties = {
  ...labelStyle,
};

// ─── Badge Styles ──────────────────────────────────────────────────────────────

export const baseBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
};

export const statusBadgeStyles = {
  success: {
    ...baseBadgeStyle,
    background: colors.successBg,
    color: colors.success,
  } as CSSProperties,
  warning: {
    ...baseBadgeStyle,
    background: colors.warningBg,
    color: colors.warning,
  } as CSSProperties,
  error: {
    ...baseBadgeStyle,
    background: colors.errorBg,
    color: colors.error,
  } as CSSProperties,
  info: {
    ...baseBadgeStyle,
    background: colors.infoBg,
    color: colors.info,
  } as CSSProperties,
};

// ─── Layout Styles ─────────────────────────────────────────────────────────────

export const flexCenter: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const flexBetween: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const flexColumn: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

export const gridResponsive = (minWidth = 280): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
  gap: 16,
});

// ─── Section Styles ────────────────────────────────────────────────────────────

export const sectionStyle: CSSProperties = {
  marginBottom: 32,
};

export const sectionTitleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 16,
  color: 'var(--text-primary)',
};

export const pageContainerStyle: CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: '24px 16px',
};

// ─── Modal Styles ──────────────────────────────────────────────────────────────

export const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
};

export const modalContentStyle: CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  maxWidth: 500,
  width: '100%',
  maxHeight: '90vh',
  overflow: 'auto',
};

export const modalHeaderStyle: CSSProperties = {
  ...flexBetween,
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-color)',
};

export const modalBodyStyle: CSSProperties = {
  padding: 20,
};

export const modalFooterStyle: CSSProperties = {
  ...flexBetween,
  padding: '16px 20px',
  borderTop: '1px solid var(--border-color)',
  gap: 12,
};

// ─── Table Styles ──────────────────────────────────────────────────────────────

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
};

export const tableHeaderStyle: CSSProperties = {
  background: 'var(--bg-secondary)',
  textAlign: 'left',
  padding: '12px 16px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--border-color)',
};

export const tableCellStyle: CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--border-color)',
  verticalAlign: 'middle',
};

// ─── Empty State ───────────────────────────────────────────────────────────────

export const emptyStateStyle: CSSProperties = {
  ...flexCenter,
  flexDirection: 'column',
  padding: 48,
  color: 'var(--text-muted)',
  textAlign: 'center',
};
