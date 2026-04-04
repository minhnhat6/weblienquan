'use client';

/**
 * SpinHistory - Shows recent spin results
 */

interface HistoryItem {
  label: string;
  amount: number;
  time: string;
}

interface SpinHistoryProps {
  history: HistoryItem[];
}

export function SpinHistory({ history }: SpinHistoryProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 16,
      padding: 20,
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
        📜 Lịch Sử Quay
      </h3>
      {history.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
          Chưa có lịch sử
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {history.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              <span style={{ color: item.amount > 0 ? '#10b981' : '#6b7280', fontWeight: 600 }}>
                {item.label}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{item.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
