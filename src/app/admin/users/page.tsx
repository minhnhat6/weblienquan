'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { formatPrice } from '@/lib/data';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
  discount: number;
  spinTickets: number;
  createdAt: string;
  totalSpend: number;
  _count?: {
    orders: number;
    transactions: number;
  };
}

interface AdminUsersResponse {
  users: Array<{
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    balance: number | string;
    discount: number;
    spinTickets: number;
    createdAt: string;
    totalSpend?: number;
    _count?: {
      orders: number;
      transactions: number;
    };
  }>;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [balanceChange, setBalanceChange] = useState('');
  const [roleChange, setRoleChange] = useState<'user' | 'admin'>('user');
  const [discountChange, setDiscountChange] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Không thể tải danh sách người dùng');
      }

      const payload = json.data as AdminUsersResponse;
      setUsers(
        payload.users.map((user) => ({
          ...user,
          balance: Number(user.balance),
          totalSpend: Number(user.totalSpend || 0),
          createdAt: typeof user.createdAt === 'string' ? user.createdAt : new Date(user.createdAt).toISOString(),
        })),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách người dùng';
      setError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const getUserOrders = (user: AdminUser) => user._count?.orders ?? 0;
  const getUserSpend = (user: AdminUser) => user.totalSpend;

  const filtered = useMemo(
    () => users.filter(u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search],
  );

  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setBalanceChange('');
    setRoleChange(u.role);
    setDiscountChange(String(u.discount));
  };

  const handleSave = async () => {
    if (!editUser) return;
    const nextDiscount = Number(discountChange);
    const nextBalance = balanceChange ? editUser.balance + Number(balanceChange) : editUser.balance;
    if (!Number.isFinite(nextDiscount) || nextDiscount < 0 || nextDiscount > 100) {
      alert('Giảm giá phải từ 0 đến 100');
      return;
    }
    if (!Number.isFinite(nextBalance) || nextBalance < 0) {
      alert('Số dư không hợp lệ');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: roleChange,
          discount: nextDiscount,
          balance: nextBalance,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không thể cập nhật người dùng');
      }
      await loadUsers();
      setEditUser(null);
      alert('Cập nhật người dùng thành công!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật người dùng');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    if (u.role === 'admin') { alert('Không thể xóa tài khoản admin!'); return; }
    if (!confirm(`Xóa người dùng ${u.username}?`)) return;
    setDeletingId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không thể xóa người dùng');
      }
      setUsers(prev => prev.filter(item => item.id !== u.id));
      alert('Đã xóa người dùng!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa người dùng');
    } finally {
      setDeletingId(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', background: '#111827',
    border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8,
    color: '#e8eaed', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaed' }}>👥 Quản Lý Người Dùng</h1>
          <div style={{ padding: '8px 16px', background: '#1a1f35', borderRadius: 8, fontSize: 13, color: '#6b7280' }}>
            Tổng: <strong style={{ color: '#e8eaed' }}>{users.length}</strong> tài khoản
          </div>
        </div>

        <input placeholder="🔍 Tìm theo tên đăng nhập, email..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: 20, maxWidth: 400 }} />

        <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, overflow: 'hidden' }}>
          {loading && <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Đang tải danh sách người dùng...</div>}
          {!loading && error && <div style={{ padding: 24, textAlign: 'center', color: '#ef4444' }}>{error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Không tìm thấy tài khoản nào</div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#111827' }}>
                  {['Người Dùng', 'Email', 'Vai Trò', 'Số Dư', 'Tổng Chi', 'Đơn Hàng', 'Ngày ĐK', 'Hành Động'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed' }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, fontWeight: 700, background: u.role === 'admin' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)', color: u.role === 'admin' ? '#ef4444' : '#6366f1' }}>
                        {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#10b981', fontWeight: 600 }}>{formatPrice(u.balance)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>{formatPrice(getUserSpend(u))}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>{getUserOrders(u)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(u)} style={{ padding: '5px 10px', background: 'rgba(99,102,241,0.2)', border: 'none', borderRadius: 6, color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>✏️</button>
                        {u.role !== 'admin' && <button disabled={deletingId === u.id} onClick={() => void handleDelete(u)} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 6, color: '#ef4444', fontSize: 11, cursor: deletingId === u.id ? 'wait' : 'pointer', fontWeight: 600 }}>{deletingId === u.id ? '...' : '🗑️'}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editUser && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => e.target === e.currentTarget && setEditUser(null)}>
            <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e8eaed', marginBottom: 20 }}>✏️ Chỉnh Sửa: {editUser.username}</h2>
              <div style={{ background: '#111827', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#9ca3af' }}>
                Số dư hiện tại: <strong style={{ color: '#10b981' }}>{formatPrice(editUser.balance)}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Điều Chỉnh Số Dư (+ thêm / - trừ)</label>
                  <input type="number" value={balanceChange} onChange={e => setBalanceChange(e.target.value)} placeholder="VD: 50000 hoặc -10000" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Vai Trò</label>
                  <select value={roleChange} onChange={e => setRoleChange(e.target.value as 'user' | 'admin')} style={inputStyle}>
                    <option value="user">👤 User</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Giảm Giá (%)</label>
                  <input type="number" value={discountChange} onChange={e => setDiscountChange(e.target.value)} placeholder="0" min="0" max="100" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button onClick={() => setEditUser(null)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Huỷ</button>
                  <button disabled={saving} onClick={() => void handleSave()} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: 'white', cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>{saving ? 'Đang lưu...' : '✅ Lưu'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
