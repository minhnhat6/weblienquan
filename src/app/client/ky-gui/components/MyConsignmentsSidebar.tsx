/**
 * My Consignments Sidebar Component
 * Shows user's consignment items and stats
 */

'use client';

import { ConsignmentItem } from '@/lib/auth';
import { formatPrice } from '@/lib/data';
import { STATUS_CONFIG, MyListingCard } from './index';
import { cardStyle } from '@/lib/ui-styles';

interface MyConsignmentsSidebarProps {
  items: ConsignmentItem[];
  onDelete: (id: string) => void;
  onSubmitClick: () => void;
}

export function MyConsignmentsSidebar({ items, onDelete, onSubmitClick }: MyConsignmentsSidebarProps) {
  const earned = items.filter(c => c.status === 'sold').reduce((s, c) => s + c.askPrice, 0);

  return (
    <div style={{ ...cardStyle, borderRadius: 12, padding: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
        📦 Ký Gửi Của Tôi
      </h2>
      
      {/* Earnings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Đã kiếm được</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{formatPrice(earned)}</span>
      </div>
      
      {/* Status stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {(['pending', 'approved', 'sold', 'rejected'] as const).map(s => {
          const status = STATUS_CONFIG[s];
          const count = items.filter(c => c.status === s).length;
          return (
            <div key={s} style={{ 
              background: status.bg, 
              border: `1px solid ${status.color}33`, 
              borderRadius: 8, 
              padding: '8px 10px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: status.color }}>{count}</div>
              <div style={{ fontSize: 10, color: status.color }}>{status.label}</div>
            </div>
          );
        })}
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
          Chưa có ký gửi nào.
          <button 
            onClick={onSubmitClick} 
            style={{ 
              display: 'block', margin: '8px auto 0', 
              color: '#6366f1', background: 'none', border: 'none', 
              cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' 
            }}
          >
            + Ký gửi ngay
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
          {items.map(c => (
            <MyListingCard key={c.id} item={c} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
