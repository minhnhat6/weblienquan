'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/lib/auth';
import { formatPrice, products } from '@/lib/data';
import { getBusinessLogs, getErrorLogs, getPerfLogs } from '@/lib/observability';
import { runReconciliation } from '@/lib/reconciliation';

function StatCard({ icon, label, value, color, sub }: { icon: string; label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{
      background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 12, padding: '20px 24px',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { getAllUsers, getAllOrders, getAllTransactions, getPendingRecharges } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const users = getAllUsers();
  const orders = getAllOrders();
  const transactions = getAllTransactions();
  const recharges = getPendingRecharges();
  const businessLogs = getBusinessLogs();
  const errorLogs = getErrorLogs();
  const perfLogs = getPerfLogs();

  const slo = useMemo(() => {
    const durations = perfLogs.map(p => p.durationMs).sort((a, b) => a - b);
    const p95 = durations.length > 0 ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))] : 0;
    const failures = perfLogs.filter(p => !p.ok).length;
    const errorRate = perfLogs.length > 0 ? (failures / perfLogs.length) * 100 : 0;
    const uptime = perfLogs.length > 0 ? 100 - errorRate : 100;
    return { p95, errorRate, uptime, sampleSize: perfLogs.length };
  }, [perfLogs]);

  const reconciliation = useMemo(() => runReconciliation({
    users,
    orders,
    transactions,
    recharges,
  }), [users, orders, recharges, transactions]);

  const totalRevenue = orders.reduce((s, o) => s + o.amount, 0);
  const pendingCount = recharges.filter(r => r.status === 'pending').length;
  const todayOrders = orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString());

  const popularProducts = (() => {
    const counts: Record<string, { name: string; count: number }> = {};
    orders.forEach(o => {
      if (!counts[o.productId]) counts[o.productId] = { name: o.productName, count: 0 };
      counts[o.productId].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  })();

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e8eaed', marginBottom: 4 }}>📊 Tổng Quan</h1>
          <p style={{ color: '#6b7280', fontSize: 13 }}>Chào mừng trở lại, Admin! Đây là tình trạng hệ thống hôm nay.</p>
          </div>
          <button
            onClick={() => setRefreshKey(v => v + 1)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid rgba(99,102,241,0.35)',
              background: 'rgba(99,102,241,0.15)',
              color: '#a5b4fc',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            🔄 Refresh Metrics ({refreshKey})
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard icon="💰" label="Tổng Doanh Thu" value={formatPrice(totalRevenue)} color="#10b981" sub={`${orders.length} đơn hàng`} />
          <StatCard icon="📦" label="Đơn Hôm Nay" value={String(todayOrders.length)} color="#6366f1" sub={`Tổng: ${orders.length} đơn`} />
          <StatCard icon="👥" label="Người Dùng" value={String(users.length)} color="#f59e0b" sub="Đã đăng ký" />
          <StatCard icon="⏳" label="Chờ Duyệt Nạp" value={String(pendingCount)} color={pendingCount > 0 ? '#ef4444' : '#6b7280'} sub="Yêu cầu nạp tiền" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Recent Orders */}
          <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e8eaed' }}>📋 Đơn Hàng Gần Nhất</h2>
              <Link href="/admin/orders" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>Xem tất cả →</Link>
            </div>
            {orders.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Chưa có đơn hàng</p>
            ) : (
              <div>
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
                    <div>
                      <div style={{ color: '#e8eaed', fontWeight: 600, marginBottom: 2 }}>{o.productName}</div>
                      <div style={{ color: '#6b7280' }}>{o.userId}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#f59e0b', fontWeight: 700 }}>{formatPrice(o.amount)}</div>
                      <div style={{ color: '#6b7280' }}>{new Date(o.date).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular Products */}
          <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e8eaed' }}>🔥 Sản Phẩm Bán Chạy</h2>
              <Link href="/admin/products" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>Quản lý →</Link>
            </div>
            {popularProducts.length === 0 ? (
              <div>
                {products.slice(0, 5).map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: 'rgba(99,102,241,0.2)', color: '#6366f1', width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>{i + 1}</span>
                      <span style={{ color: '#e8eaed' }}>{p.name}</span>
                    </div>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{p.soldCount.toLocaleString()} đã bán</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {popularProducts.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
                    <span style={{ color: '#e8eaed' }}>{p.name}</span>
                    <span style={{ color: '#6366f1', fontWeight: 700 }}>{p.count} đơn</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Observability */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e8eaed', marginBottom: 12 }}>📈 KPI / SLO</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <StatCard icon="⚡" label="HTTP p95" value={`${Math.round(slo.p95)}ms`} color="#06b6d4" sub={`${slo.sampleSize} samples`} />
            <StatCard icon="🚨" label="Error Rate" value={`${slo.errorRate.toFixed(2)}%`} color={slo.errorRate > 5 ? '#ef4444' : '#10b981'} sub="HTTP failures" />
            <StatCard icon="🟢" label="Estimated Uptime" value={`${slo.uptime.toFixed(2)}%`} color={slo.uptime < 99 ? '#f59e0b' : '#10b981'} sub="Calculated from request success" />
            <StatCard icon="🧾" label="Business Events" value={String(businessLogs.length)} color="#8b5cf6" sub={`${errorLogs.length} client errors`} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div style={{ background: '#1a1f35', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#fda4af' }}>🛑 Client Errors (mới nhất)</h3>
            {errorLogs.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>Chưa ghi nhận lỗi client.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {errorLogs.slice(0, 5).map(err => (
                  <div key={err.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#e8eaed', fontWeight: 600 }}>{err.message}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(err.ts).toLocaleString('vi-VN')} · {err.route || 'n/a'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#1a1f35', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#6ee7b7' }}>🧠 Business Audit (mới nhất)</h3>
            {businessLogs.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>Chưa có event nghiệp vụ.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {businessLogs.slice(0, 5).map(log => (
                  <div key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#e8eaed', fontWeight: 600 }}>{log.type}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {new Date(log.ts).toLocaleString('vi-VN')}
                      {log.actorName ? ` · ${log.actorName}` : ''}
                      {log.targetId ? ` · #${log.targetId}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e8eaed', marginBottom: 16 }}>⚡ Thao Tác Nhanh</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { href: '/admin/products', label: '+ Thêm Sản Phẩm', color: '#6366f1' },
              { href: '/admin/recharges', label: `💰 Duyệt Nạp (${pendingCount})`, color: pendingCount > 0 ? '#ef4444' : '#6b7280' },
                { href: '/admin/reconciliation', label: `🧮 Đối Soát (${reconciliation.issues.length})`, color: reconciliation.issues.length > 0 ? '#f59e0b' : '#10b981' },
              { href: '/admin/stock', label: '📥 Nhập Kho', color: '#10b981' },
              { href: '/admin/blog', label: '✏️ Viết Bài', color: '#f59e0b' },
              { href: '/admin/users', label: '👥 Quản Lý User', color: '#8b5cf6' },
              { href: '/admin/settings', label: '⚙️ Cài Đặt', color: '#06b6d4' },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{
                padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
                background: `${a.color}22`, border: `1px solid ${a.color}44`,
                color: a.color, fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              }}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
