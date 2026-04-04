'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth, PendingRecharge } from '@/lib/auth';
import { formatPrice } from '@/lib/data';

export default function AdminRecharges() {
  const { getPendingRecharges, approveRecharge, rejectRecharge, getAllUsers, showToast } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [, setRefreshKey] = useState(0);

  const recharges = getPendingRecharges();
  const users = getAllUsers();

  const filtered = filter === 'all' ? recharges : recharges.filter(r => r.status === filter);
  const pendingTotal = recharges.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  const approvedTotal = recharges.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0);

  const handleApprove = (id: string) => {
    approveRecharge(id);
    setRefreshKey(k => k + 1);
  };

  const handleReject = (id: string) => {
    rejectRecharge(id);
    setRefreshKey(k => k + 1);
  };

  // Demo: Add mock pending recharge
  const addMockRecharge = () => {
    const mockUsers = users.filter(u => u.role === 'user');
    if (mockUsers.length === 0) { showToast('Cần có ít nhất 1 user để tạo yêu cầu test!', 'error'); return; }
    // Use crypto for secure random selection
    const randomBytes = new Uint32Array(2);
    crypto.getRandomValues(randomBytes);
    const u = mockUsers[randomBytes[0] % mockUsers.length];
    const amounts = [50000, 100000, 200000, 500000];
    const amount = amounts[randomBytes[1] % amounts.length];
    const mock: PendingRecharge = {
      id: 'RCH-' + Date.now(),
      userId: u.id, username: u.username,
      amount, method: 'bank', note: `NAP ${u.username.toUpperCase()}`,
      date: new Date().toISOString(), status: 'pending',
    };
    const existing = JSON.parse(localStorage.getItem('slq_recharges') || '[]');
    localStorage.setItem('slq_recharges', JSON.stringify([mock, ...existing]));
    setRefreshKey(k => k + 1);
    showToast('Đã tạo yêu cầu nạp tiền test!', 'success');
  };

  const statusColor = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
  const statusLabel = { pending: '⏳ Chờ duyệt', approved: '✅ Đã duyệt', rejected: '❌ Từ chối' };

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaed' }}>💰 Duyệt Nạp Tiền</h1>
          <button onClick={addMockRecharge} style={{ padding: '8px 16px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#6366f1', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            + Tạo Yêu Cầu Test
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Đang Chờ Duyệt', value: recharges.filter(r => r.status === 'pending').length + ' yêu cầu', sub: formatPrice(pendingTotal), color: '#f59e0b' },
            { label: 'Đã Duyệt', value: recharges.filter(r => r.status === 'approved').length + ' yêu cầu', sub: formatPrice(approvedTotal), color: '#10b981' },
            { label: 'Đã Từ Chối', value: recharges.filter(r => r.status === 'rejected').length + ' yêu cầu', sub: '', color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1a1f35', border: `1px solid ${s.color}33`, borderRadius: 12, padding: 16, borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
              {s.sub && <div style={{ fontSize: 12, color: s.color, marginTop: 4, fontWeight: 600 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              background: filter === f ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.1)',
              color: filter === f ? 'white' : '#9ca3af',
            }}>
              {f === 'all' ? 'Tất Cả' : statusLabel[f]} ({f === 'all' ? recharges.length : recharges.filter(r => r.status === f).length})
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 40, textAlign: 'center', color: '#6b7280' }}>
              📭 Không có yêu cầu nào
            </div>
          ) : filtered.map(r => (
            <div key={r.id} style={{ background: '#1a1f35', border: `1px solid ${statusColor[r.status]}33`, borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                    {r.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaed' }}>{r.username}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{r.id} · {new Date(r.date).toLocaleString('vi-VN')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span>💳 <strong style={{ color: '#f59e0b', fontSize: 16 }}>{formatPrice(r.amount)}</strong></span>
                  <span style={{ color: '#9ca3af' }}>🏦 {r.method === 'bank' ? 'Ngân hàng' : 'Thẻ cào'}</span>
                  <span style={{ color: '#9ca3af' }}>📝 {r.note}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 12, fontWeight: 700, background: `${statusColor[r.status]}22`, color: statusColor[r.status] }}>
                  {statusLabel[r.status]}
                </span>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApprove(r.id)} style={{ padding: '7px 16px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✅ Duyệt
                    </button>
                    <button onClick={() => handleReject(r.id)} style={{ padding: '7px 16px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ❌ Từ chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
