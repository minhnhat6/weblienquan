'use client';

import { useState, Fragment } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/data';

export default function AdminOrders() {
  const { getAllOrders, getAllUsers } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const orders = getAllOrders();
  const users = getAllUsers();

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.username || userId;

  const filtered = orders.filter(o => {
    const matchSearch = o.productName.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()) || getUserName(o.userId).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered.reduce((s, o) => s + o.amount, 0);

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaed', marginBottom: 8 }}>📋 Quản Lý Đơn Hàng</h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Tổng Đơn Hàng', value: orders.length, color: '#6366f1' },
            { label: 'Đơn Lọc Hiện Tại', value: filtered.length, color: '#10b981' },
            { label: 'Doanh Thu Lọc', value: formatPrice(totalRevenue), color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input placeholder="🔍 Tìm theo mã, sản phẩm, user..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '9px 14px', background: '#111827', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#e8eaed', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 14px', background: '#111827', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#e8eaed', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="success">✅ Thành công</option>
            <option value="pending">⏳ Đang xử lý</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>📭 Không có đơn hàng nào</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#111827' }}>
                    {['Mã ĐH', 'Khách Hàng', 'Sản Phẩm', 'Giá', 'Ngày', 'Trạng Thái', 'Chi Tiết'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <Fragment key={o.id}>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{o.id.slice(0, 16)}...</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#e8eaed', fontWeight: 600 }}>{getUserName(o.userId)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', maxWidth: 200 }}>{o.productName}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#f59e0b', fontWeight: 700 }}>{formatPrice(o.amount)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(o.date).toLocaleDateString('vi-VN')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 700, background: o.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: o.status === 'success' ? '#10b981' : '#f59e0b' }}>
                            {o.status === 'success' ? '✅ Thành công' : '⏳ Đang xử lý'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => setSelectedOrder(selectedOrder === o.id ? null : o.id)}
                            style={{ padding: '5px 10px', background: 'rgba(99,102,241,0.2)', border: 'none', borderRadius: 6, color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                            {selectedOrder === o.id ? '▲ Ẩn' : '▼ Xem ACC'}
                          </button>
                        </td>
                      </tr>
                      {selectedOrder === o.id && (
                        <tr key={`${o.id}-detail`}>
                          <td colSpan={7} style={{ padding: '0 16px 16px' }}>
                            <div style={{ background: '#0a0e1a', border: '2px solid #10b981', borderRadius: 8, padding: 16 }}>
                              <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700, marginBottom: 8 }}>📋 THÔNG TIN TÀI KHOẢN:</div>
                              <pre style={{ fontFamily: 'monospace', fontSize: 13, color: '#e8eaed', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{o.accountData}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
