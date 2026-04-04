'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/data';

export default function OrdersPage() {
  const { user, orders, showToast } = useAuth();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const safeUser = mounted ? user : null;
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const userOrders = safeUser ? orders.filter(o => o.userId === safeUser.id) : [];

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-content">
        {!safeUser ? (
          <div className="empty-state">
            <div className="icon">🔒</div>
            <p>Vui lòng <Link href="/client/login" style={{ color: 'var(--accent-primary)' }}>đăng nhập</Link> để xem lịch sử mua hàng</p>
          </div>
        ) : (
          <>
            <div className="section-title">📦 Lịch Sử Mua Hàng</div>

            {userOrders.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📭</div>
                <p>Bạn chưa có đơn hàng nào</p>
                <Link href="/" className="btn btn-primary" style={{ marginTop: 16 }}>Mua ngay</Link>
              </div>
            ) : (
              <div className="dash-card">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã ĐH</th>
                        <th>Sản phẩm</th>
                        <th>Giá</th>
                        <th>Ngày</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userOrders.map(order => (
                        <tr key={order.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.id}</td>
                          <td>{order.productName}</td>
                          <td style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>{formatPrice(order.amount)}</td>
                          <td>{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                          <td><span className={`status-badge ${order.status === 'success' ? 'success' : 'pending'}`}>
                            {order.status === 'success' ? '✅ Thành công' : '⏳ Đang xử lý'}
                          </span></td>
                          <td>
                            <button className="btn btn-sm btn-outline" onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}>
                              {selectedOrder === order.id ? '🔼 Ẩn' : '🔽 Xem ACC'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Account Data Reveal */}
            {selectedOrder && (() => {
              const order = userOrders.find(o => o.id === selectedOrder);
              if (!order) return null;
              return (
                <div className="account-reveal" style={{ marginTop: 16 }}>
                  <h4>📋 Thông tin tài khoản - {order.productName}</h4>
                  <div className="account-data">{order.accountData}</div>
                  <button className="copy-btn" onClick={() => {
                    navigator.clipboard.writeText(order.accountData);
                    showToast('Đã sao chép!', 'success');
                  }}>📋 Sao chép</button>
                </div>
              );
            })()}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
