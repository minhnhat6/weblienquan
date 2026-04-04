/**
 * Ký Gửi Page Components
 * Shared constants, types, and components for consignment feature
 */

import { CSSProperties } from 'react';
import Link from 'next/link';
import { ConsignmentItem } from '@/lib/auth';
import { formatPrice } from '@/lib/data';
import { inputStyle, cardStyle, primaryButtonStyle, flexCenter } from '@/lib/ui-styles';

// ─── Constants ─────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  'Liên Quân', 'TFT', 'Blox Fruits', 'FC Online', 'FC Mobile', 
  'Zing Speed', 'Delta Force', 'Play Together', 'Hải Tặc', 'Khác'
];

export const FEE_PERCENT = 20;
export const SELLER_PERCENT = 100 - FEE_PERCENT;

export const STATUS_CONFIG = {
  pending:  { label: '⏳ Chờ duyệt',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  approved: { label: '✅ Đang bán',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  rejected: { label: '❌ Từ chối',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  sold:     { label: '💰 Đã bán',     color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
} as const;

export const INITIAL_FORM = {
  title: '',
  description: '',
  categoryName: 'Liên Quân',
  accountData: '',
  askPrice: '',
};

export type TabType = 'list' | 'submit';
export type ConsignmentForm = typeof INITIAL_FORM;

// ─── Styles ────────────────────────────────────────────────────────────────────

export const INPUT_STYLE = inputStyle;

const featureCardStyle: CSSProperties = {
  background: 'rgba(99,102,241,0.1)',
  border: '1px solid rgba(99,102,241,0.2)',
  borderRadius: 10,
  padding: '12px 16px',
  textAlign: 'center',
  minWidth: 110,
};

const heroBannerStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #1a1f35, #111827)',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: 16,
  padding: '28px 32px',
  marginBottom: 28,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 16,
};

// ─── Sub-Components ────────────────────────────────────────────────────────────

/** Feature highlight cards for hero section */
export function FeatureCards() {
  const features = [
    { icon: '🔒', label: 'An Toàn', sub: 'Shop làm trung gian' },
    { icon: '💰', label: `${SELLER_PERCENT}% cho bạn`, sub: 'Nhận tiền ngay ví' },
    { icon: '⚡', label: 'Nhanh Chóng', sub: 'Duyệt trong 24h' },
  ];

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {features.map(f => (
        <div key={f.label} style={featureCardStyle}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>{f.icon}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>{f.label}</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>{f.sub}</div>
        </div>
      ))}
    </div>
  );
}

/** Hero banner section */
export function HeroBanner() {
  return (
    <div style={heroBannerStyle}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#e8eaed', marginBottom: 8 }}>
          🤝 Ký Gửi Tài Khoản
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, maxWidth: 500 }}>
          Ký gửi tài khoản game lên shop để bán trung gian. Shop thu{' '}
          <strong style={{ color: '#f59e0b' }}>{FEE_PERCENT}% phí</strong>, 
          bạn nhận phần còn lại ngay khi acc được bán thành công!
        </p>
      </div>
      <FeatureCards />
    </div>
  );
}

/** Tab switcher component */
export function TabSwitcher({ 
  tab, 
  onChange 
}: { 
  tab: TabType; 
  onChange: (t: TabType) => void;
}) {
  const tabs = [
    { id: 'list' as const, label: '📋 Danh Sách Đang Bán' },
    { id: 'submit' as const, label: '+ Ký Gửi Mới' },
  ];

  return (
    <div style={{ 
      display: 'flex', gap: 4, marginBottom: 20, 
      background: 'var(--bg-secondary)', padding: 4, 
      borderRadius: 10, width: 'fit-content' 
    }}>
      {tabs.map(t => (
        <button 
          key={t.id} 
          onClick={() => onChange(t.id)} 
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: tab === t.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
            color: tab === t.id ? 'white' : 'var(--text-secondary)',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Price preview component */
export function PricePreview({ askPrice }: { askPrice: string }) {
  if (!askPrice) return null;
  const amount = Number(askPrice);
  const salePrice = Math.ceil(amount / (1 - FEE_PERCENT / 100));

  return (
    <div style={{ 
      background: 'rgba(99,102,241,0.08)', 
      border: '1px solid rgba(99,102,241,0.2)', 
      borderRadius: 8, 
      padding: '10px 14px', 
      fontSize: 13, 
      display: 'flex', 
      gap: 20 
    }}>
      <span>💰 Bạn nhận: <strong style={{ color: '#10b981' }}>{formatPrice(amount)}</strong></span>
      <span>🏷️ Giá bán: <strong style={{ color: '#f59e0b' }}>{formatPrice(salePrice)}</strong></span>
      <span style={{ color: '#6b7280' }}>Shop: {FEE_PERCENT}%</span>
    </div>
  );
}

/** Listing card for public view */
export function ListingCard({ item }: { item: ConsignmentItem }) {
  return (
    <div style={{ 
      ...cardStyle,
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <span style={{ 
            fontSize: 11, padding: '2px 8px', borderRadius: 8, 
            background: 'rgba(99,102,241,0.2)', color: '#6366f1', fontWeight: 700 
          }}>
            {item.categoryName}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {item.id}</span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          {item.title}
        </h3>
        {item.description && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
            {item.description}
          </p>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          👤 Người bán: {item.username} · 📅 {new Date(item.submitDate).toLocaleDateString('vi-VN')}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>
          {formatPrice(item.salePrice)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Giá bán</div>
        <Link 
          href="/client/login" 
          style={{ 
            ...primaryButtonStyle,
            display: 'inline-block',
            padding: '8px 16px',
            textDecoration: 'none',
            fontSize: 12,
          }}
        >
          Mua Ngay
        </Link>
      </div>
    </div>
  );
}

/** My listing item card */
export function MyListingCard({ 
  item, 
  onDelete 
}: { 
  item: ConsignmentItem; 
  onDelete: (id: string) => void;
}) {
  const status = STATUS_CONFIG[item.status];
  const canDelete = item.status === 'pending' || item.status === 'rejected';

  return (
    <div style={{ 
      background: 'var(--bg-secondary)', 
      borderRadius: 8, 
      padding: 12, 
      border: `1px solid ${status.color}33` 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ 
          fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', 
          flex: 1, marginRight: 8, overflow: 'hidden', 
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
        }}>
          {item.title}
        </span>
        <span style={{ 
          fontSize: 10, padding: '2px 6px', borderRadius: 6, 
          background: status.bg, color: status.color, fontWeight: 700, flexShrink: 0 
        }}>
          {status.label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Nhận: <strong style={{ color: '#10b981' }}>{formatPrice(item.askPrice)}</strong></span>
        {item.status === 'rejected' && item.rejectReason && (
          <span style={{ color: '#ef4444' }}>Lý do: {item.rejectReason}</span>
        )}
        {canDelete && (
          <button 
            onClick={() => onDelete(item.id)} 
            style={{ 
              background: 'none', border: 'none', color: '#ef4444', 
              fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' 
            }}
          >
            🗑️ Xóa
          </button>
        )}
      </div>
    </div>
  );
}

/** Instructions panel for logged out users */
export function InstructionsPanel() {
  const steps = [
    'Đăng nhập vào tài khoản',
    'Điền thông tin acc & giá muốn nhận',
    'Đợi admin duyệt (trong 24h)',
    'Acc được đăng bán, khách mua → bạn nhận tiền',
  ];

  return (
    <div style={{ ...cardStyle, borderRadius: 12, padding: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
        📋 Hướng Dẫn
      </h2>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span style={{ 
            background: 'rgba(99,102,241,0.2)', color: '#6366f1', 
            width: 22, height: 22, borderRadius: '50%', 
            ...flexCenter,
            fontWeight: 700, fontSize: 11, flexShrink: 0 
          }}>
            {i + 1}
          </span>
          {step}
        </div>
      ))}
    </div>
  );
}

/** Empty state for listings */
export function EmptyListings({ onSubmit }: { onSubmit?: () => void }) {
  return (
    <div style={{ 
      ...cardStyle,
      borderRadius: 12,
      padding: 40,
      textAlign: 'center',
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
      <p>Chưa có tài khoản ký gửi nào. Hãy là người đầu tiên!</p>
      {onSubmit && (
        <button 
          onClick={onSubmit}
          style={{ 
            marginTop: 12, color: '#6366f1', background: 'none', border: 'none', 
            cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' 
          }}
        >
          + Ký gửi ngay
        </button>
      )}
    </div>
  );
}

/** Login required state */
export function LoginRequired({ message }: { message: string }) {
  return (
    <div style={{ 
      ...cardStyle,
      borderRadius: 12,
      padding: 40,
      textAlign: 'center',
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
      <p style={{ marginBottom: 16 }}>{message}</p>
      <Link 
        href="/client/login" 
        style={{ 
          ...primaryButtonStyle,
          display: 'inline-block',
          padding: '10px 24px',
          textDecoration: 'none',
        }}
      >
        Đăng Nhập
      </Link>
    </div>
  );
}
