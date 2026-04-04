'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/data';
import { User } from '@/lib/data';

export default function AdminUsers() {
  const { getAllUsers, updateUser, deleteUser, getAllOrders } = useAuth();
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [balanceChange, setBalanceChange] = useState('');
  const [roleChange, setRoleChange] = useState<'user' | 'admin'>('user');
  const [discountChange, setDiscountChange] = useState('');

  const users = getAllUsers();
  const orders = getAllOrders();

  const getUserOrders = (uid: string) => orders.filter(o => o.userId === uid).length;
  const getUserSpend = (uid: string) => orders.filter(o => o.userId === uid).reduce((s, o) => s + o.amount, 0);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (u: User) => {
    setEditUser(u);
    setBalanceChange('');
    setRoleChange(u.role);
    setDiscountChange(String(u.discount));
  };

  const handleSave = () => {
    if (!editUser) return;
    const changes: Partial<User> = { role: roleChange, discount: Number(discountChange) };
    if (balanceChange) changes.balance = editUser.balance + Number(balanceChange);
    updateUser(editUser.id, changes);
    setEditUser(null);
  };

  const handleDelete = (u: User) => {
    if (u.role === 'admin') { alert('Không thể xóa tài khoản admin!'); return; }
    if (!confirm(`Xóa người dùng ${u.username}?`)) return;
    deleteUser(u.id);
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
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>{formatPrice(getUserSpend(u.id))}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>{getUserOrders(u.id)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{u.createdAt}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(u)} style={{ padding: '5px 10px', background: 'rgba(99,102,241,0.2)', border: 'none', borderRadius: 6, color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>✏️</button>
                        {u.role !== 'admin' && <button onClick={() => handleDelete(u)} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 6, color: '#ef4444', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>🗑️</button>}
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
                  <button onClick={handleSave} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>✅ Lưu</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
