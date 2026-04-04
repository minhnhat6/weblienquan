'use client';

import { useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/lib/auth';
import { runReconciliation } from '@/lib/reconciliation';
import { formatPrice } from '@/lib/data';

export default function AdminReconciliationPage() {
  const { getAllUsers, getAllOrders, getAllTransactions, getPendingRecharges } = useAuth();

  const report = useMemo(() => {
    return runReconciliation({
      users: getAllUsers(),
      orders: getAllOrders(),
      transactions: getAllTransactions(),
      recharges: getPendingRecharges(),
    });
  }, [getAllOrders, getAllTransactions, getAllUsers, getPendingRecharges]);

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaed', marginBottom: 6 }}>🧮 Đối Soát Dữ Liệu</h1>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0, marginBottom: 20 }}>
          Kiểm tra chênh lệch giữa orders, transactions, recharges và số dư user.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: 14 }}>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Success orders</div>
            <div style={{ color: '#e8eaed', fontSize: 22, fontWeight: 800 }}>{report.totals.successfulOrders}</div>
          </div>
          <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: 14 }}>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Purchase amount</div>
            <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 800 }}>{formatPrice(report.totals.successfulPurchasesAmount)}</div>
          </div>
          <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: 14 }}>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Approved recharge</div>
            <div style={{ color: '#10b981', fontSize: 18, fontWeight: 800 }}>{formatPrice(report.totals.approvedRechargesAmount)}</div>
          </div>
          <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: 14 }}>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Recharge tx amount</div>
            <div style={{ color: '#06b6d4', fontSize: 18, fontWeight: 800 }}>{formatPrice(report.totals.rechargeTransactionsAmount)}</div>
          </div>
        </div>

        <div style={{ background: '#1a1f35', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: 0, marginBottom: 12, color: '#fca5a5', fontSize: 15, fontWeight: 700 }}>
            🚨 Issues ({report.issues.length})
          </h2>
          {report.issues.length === 0 ? (
            <p style={{ margin: 0, color: '#86efac', fontSize: 13 }}>Không phát hiện chênh lệch dữ liệu.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {report.issues.map((issue, idx) => (
                <div key={`${issue.type}-${issue.userId || 'global'}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#fda4af', fontWeight: 700 }}>{issue.type}</div>
                  <div style={{ fontSize: 12, color: '#e8eaed' }}>{issue.details}</div>
                  {issue.userId && <div style={{ fontSize: 11, color: '#9ca3af' }}>userId: {issue.userId}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
