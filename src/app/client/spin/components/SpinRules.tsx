'use client';

/**
 * SpinRules - How to get spin tickets
 */

import Link from 'next/link';
import { RULES } from './constants';

export function SpinRules() {
  return (
    <div style={{
      background: 'rgba(99,102,241,0.08)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 16,
      padding: 16,
    }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', marginBottom: 10 }}>
        📋 Cách Nhận Lượt Quay
      </h3>
      {RULES.map((rule, index) => (
        <div
          key={index}
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 6,
            display: 'flex',
            gap: 8,
          }}
        >
          <span style={{ color: '#6366f1' }}>✓</span> {rule}
        </div>
      ))}
      <Link
        href="/"
        style={{
          display: 'inline-block',
          marginTop: 10,
          padding: '8px 16px',
          background: 'rgba(99,102,241,0.2)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 8,
          color: '#6366f1',
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        🛒 Mua Hàng Ngay →
      </Link>
    </div>
  );
}
