'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { clearObservabilityLogs, getBusinessLogs, getErrorLogs, getPerfLogs } from '@/lib/observability';
import { createBackupSnapshot, restoreBackupSnapshot, validateBackupSnapshot } from '@/lib/backup';
import { BUTTON_STYLES } from './constants';

interface OpsTabProps {
  refreshKey: number;
  onRefresh: () => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

/** Stats card data */
function getStatsCards() {
  return [
    { label: 'Business logs', value: getBusinessLogs().length, color: '#8b5cf6' },
    { label: 'Client errors', value: getErrorLogs().length, color: '#ef4444' },
    { label: 'Perf samples', value: getPerfLogs().length, color: '#06b6d4' },
  ];
}

export function OpsTab({ refreshKey, onRefresh, onToast }: OpsTabProps) {
  const importRef = useRef<HTMLInputElement | null>(null);

  const handleExportBackup = () => {
    const snapshot = createBackupSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slq-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Đã export backup localStorage.', 'success');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      
      if (!validateBackupSnapshot(parsed)) {
        onToast('File backup không hợp lệ.', 'error');
        return;
      }
      
      const result = restoreBackupSnapshot(parsed);
      onRefresh();
      onToast(`Restore thành công (${result.restored} keys). Vui lòng reload trang.`, 'success');
    } catch {
      onToast('Không thể đọc file backup.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleClearLogs = () => {
    clearObservabilityLogs();
    onRefresh();
    onToast('Đã xóa log observability ở client.', 'info');
  };

  // Force re-render when refreshKey changes
  const statsCards = getStatsCards();
  void refreshKey;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8eaed', margin: 0 }}>
        Vận Hành / Incident
      </h2>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {statsCards.map(card => (
          <StatsCard key={card.label} {...card} />
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onRefresh} style={BUTTON_STYLES.ops('#a5b4fc')}>
          🔄 Refresh
        </button>
        <button onClick={handleClearLogs} style={BUTTON_STYLES.ops('#fca5a5')}>
          🧹 Clear Client Logs
        </button>
        <button onClick={handleExportBackup} style={BUTTON_STYLES.ops('#6ee7b7')}>
          📦 Export Backup
        </button>
        <button onClick={() => importRef.current?.click()} style={BUTTON_STYLES.ops('#fcd34d')}>
          ♻️ Import Restore
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleImportBackup}
        />
      </div>

      {/* Reconciliation link */}
      <ReconciliationCard />

      {/* Runbook info */}
      <div style={{ 
        background: 'rgba(99,102,241,0.08)', 
        border: '1px solid rgba(99,102,241,0.25)', 
        borderRadius: 10, 
        padding: 12, 
        fontSize: 12, 
        color: '#c7d2fe' 
      }}>
        📄 Runbook: mở file docs/runbook/INCIDENT_RUNBOOK.md để xử lý P1/P2 incidents theo checklist.
      </div>
    </div>
  );
}

function StatsCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ 
      border: `1px solid ${color}44`, 
      background: `${color}18`, 
      borderRadius: 10, 
      padding: 12 
    }}>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#9ca3af' }}>{label}</div>
    </div>
  );
}

function ReconciliationCard() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      gap: 10, 
      border: '1px solid rgba(6,182,212,0.35)', 
      background: 'rgba(6,182,212,0.1)', 
      borderRadius: 10, 
      padding: 12 
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#67e8f9' }}>
          Đối soát ledger (orders/transactions/recharges)
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>
          Chạy kiểm tra sai lệch dữ liệu và xem cảnh báo chi tiết.
        </div>
      </div>
      <Link 
        href="/admin/reconciliation" 
        style={{ 
          textDecoration: 'none', 
          padding: '8px 12px', 
          borderRadius: 8, 
          background: 'rgba(6,182,212,0.2)', 
          color: '#67e8f9', 
          fontSize: 12, 
          fontWeight: 700 
        }}
      >
        Mở trang đối soát →
      </Link>
    </div>
  );
}
