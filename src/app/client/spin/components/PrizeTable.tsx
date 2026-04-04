'use client';

/**
 * PrizeTable - Shows available rewards
 */

import { Reward } from './SpinWheel';

interface PrizeTableProps {
  rewards: Reward[];
}

const HOT_THRESHOLD = 100000;

export function PrizeTable({ rewards }: PrizeTableProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 16,
      padding: 20,
    }}>
      <h3 style={{
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        🎁 Bảng Phần Thưởng
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rewards.map((reward, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'var(--bg-secondary)',
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: reward.color,
                flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            />
            <span
              style={{
                color: (reward.amount ?? 0) > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: (reward.amount ?? 0) > 50000 ? 700 : 400,
              }}
            >
              {reward.label}
            </span>
            {(reward.amount ?? 0) >= HOT_THRESHOLD && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  background: 'rgba(239,68,68,0.2)',
                  color: '#ef4444',
                  padding: '2px 6px',
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                HOT
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
