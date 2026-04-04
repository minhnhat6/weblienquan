'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth, ConsignmentItem } from '@/lib/auth';
import { formatPrice } from '@/lib/data';

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending:  { label: '⏳ Chờ duyệt', color: '#f59e0b' },
  approved: { label: '✅ Đang bán',  color: '#10b981' },
  rejected: { label: '❌ Từ chối',   color: '#ef4444' },
  sold:     { label: '💰 Đã bán',    color: '#6366f1' },
};

export default function AdminConsignments() {
  const { getConsignments, updateConsignment, deleteConsignment } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'sold'>('pending');
  const [selected, setSelected] = useState<ConsignmentItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customSalePrice, setCustomSalePrice] = useState('');
  const [, setRefreshKey] = useState(0);

  const all = getConsignments();
  const filtered = filter === 'all' ? all : all.filter(c => c.status === filter);

  const stats = {
    pending: all.filter(c => c.status === 'pending').length,
    approved: all.filter(c => c.status === 'approved').length,
    sold: all.filter(c => c.status === 'sold').length,
    revenue: all.filter(c => c.status === 'sold').reduce((s, c) => s + (c.salePrice - c.askPrice), 0),
  };

  const refresh = () => setRefreshKey(k => k + 1);

  const handleApprove = (c: ConsignmentItem) => {
    const salePrice = customSalePrice ? Number(customSalePrice) : c.salePrice;
    updateConsignment(c.id, { status: 'approved', salePrice });
    setSelected(null);
    setCustomSalePrice('');
    refresh();
  };

  const handleReject = (id: string) => {
    updateConsignment(id, { status: 'rejected', rejectReason: rejectReason || 'Không đáp ứng tiêu chuẩn' });
    setSelected(null);
    setRejectReason('');
    refresh();
  };

  const handleMarkSold = (c: ConsignmentItem) => {
    updateConsignment(c.id, { status: 'sold', soldDate: new Date().toISOString(), soldAmount: c.askPrice });
    refresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Xóa ký gửi này?')) return;
    deleteConsignment(id);
    refresh();
  };

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaed', marginBottom: 24 }}>🤝 Quản Lý Ký Gửi</h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Chờ Duyệt', value: stats.pending, color: '#f59e0b' },
            { label: 'Đang Bán', value: stats.approved, color: '#10b981' },
            { label: 'Đã Bán', value: stats.sold, color: '#6366f1' },
            { label: 'Phí Shop', value: formatPrice(stats.revenue), color: '#06b6d4' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1a1f35', border: `1px solid ${s.color}33`, borderRadius: 12, padding: '16px 20px', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['all', 'pending', 'approved', 'sold', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              background: filter === f ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.1)',
              color: filter === f ? 'white' : '#9ca3af',
            }}>
              {f === 'all' ? 'Tất Cả' : STATUS_INFO[f]?.label} ({f === 'all' ? all.length : all.filter(c => c.status === f).length})
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ background: '#1a1f35', borderRadius: 12, padding: 40, textAlign: 'center', color: '#6b7280' }}>
            📭 Không có ký gửi nào
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(c => (
              <div key={c.id} style={{ background: '#1a1f35', border: `1px solid ${STATUS_INFO[c.status]?.color}33`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: `${STATUS_INFO[c.status]?.color}22`, color: STATUS_INFO[c.status]?.color, fontWeight: 700 }}>{STATUS_INFO[c.status]?.label}</span>
                      <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.2)', color: '#6366f1', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>{c.categoryName}</span>
                      <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{c.id}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8eaed', marginBottom: 4 }}>{c.title}</h3>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>{c.description}</p>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      👤 {c.username} · 📅 {new Date(c.submitDate).toLocaleDateString('vi-VN')}
                      {c.rejectReason && <span style={{ color: '#ef4444', marginLeft: 12 }}>Lý do từ chối: {c.rejectReason}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>User nhận</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>{formatPrice(c.askPrice)}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Giá bán</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{formatPrice(c.salePrice)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button onClick={() => setSelected(c)} style={{ padding: '5px 10px', background: 'rgba(6,182,212,0.2)', border: 'none', borderRadius: 6, color: '#06b6d4', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>👁️ ACC</button>
                      {c.status === 'pending' && <>
                        <button onClick={() => { setSelected(c); setCustomSalePrice(String(c.salePrice)); }} style={{ padding: '5px 10px', background: 'rgba(16,185,129,0.2)', border: 'none', borderRadius: 6, color: '#10b981', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>✅ Duyệt</button>
                        <button onClick={() => handleReject(c.id)} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 6, color: '#ef4444', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>❌ Từ chối</button>
                      </>}
                      {c.status === 'approved' && (
                        <button onClick={() => handleMarkSold(c)} style={{ padding: '5px 10px', background: 'rgba(99,102,241,0.2)', border: 'none', borderRadius: 6, color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>💰 Đánh dấu bán</button>
                      )}
                      <button onClick={() => handleDelete(c.id)} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, color: '#ef4444', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => e.target === e.currentTarget && setSelected(null)}>
            <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#e8eaed', marginBottom: 16 }}>🔍 Chi Tiết: {selected.title}</h2>
              <div style={{ background: '#0a0e1a', border: '2px solid #10b981', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginBottom: 6 }}>📋 THÔNG TIN TÀI KHOẢN:</div>
                <pre style={{ fontFamily: 'monospace', fontSize: 13, color: '#e8eaed', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{selected.accountData}</pre>
              </div>
              {selected.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Giá bán (có thể chỉnh)</label>
                    <input type="number" value={customSalePrice} onChange={e => setCustomSalePrice(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#e8eaed', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Lý do từ chối (nếu từ chối)</label>
                    <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Nhập lý do..."
                      style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#e8eaed', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => handleApprove(selected)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>✅ Duyệt & Đăng Bán</button>
                    <button onClick={() => handleReject(selected.id)} style={{ flex: 1, padding: '10px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>❌ Từ Chối</button>
                  </div>
                </div>
              )}
              <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 12, padding: '8px', background: 'transparent', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Đóng</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
