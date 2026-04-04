'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/data';

export default function InvoicesPage() {
  const { user, transactions } = useAuth();

  if (!user) {
    return (
      <>
        <Header /><div className="main-content"><div className="empty-state"><div className="icon">🔒</div>
        <p>Vui lòng <a href="/client/login" style={{color:'var(--accent-primary)'}}>đăng nhập</a> để xem hoá đơn</p></div></div><Footer />
      </>
    );
  }

  const userTx = transactions.filter(t => t.userId === user.id);

  return (
    <>
      <Header />
      <div className="main-content">
        <div className="section-title">📄 Hoá Đơn / Lịch Sử Giao Dịch</div>

        <div className="dash-card" style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Số dư hiện tại</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>{formatPrice(user.balance)}</div>
        </div>

        {userTx.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="dash-card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã GD</th>
                    <th>Loại</th>
                    <th>Số tiền</th>
                    <th>Mô tả</th>
                    <th>Ngày</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {userTx.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{tx.id}</td>
                      <td>
                        {tx.type === 'recharge' && '💰 Nạp tiền'}
                        {tx.type === 'purchase' && '🛒 Mua hàng'}
                        {tx.type === 'referral' && '🤝 Giới thiệu'}
                        {tx.type === 'spin' && '🎰 Vòng quay'}
                      </td>
                      <td style={{
                        color: tx.amount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                        fontWeight: 600
                      }}>
                        {tx.amount >= 0 ? '+' : ''}{formatPrice(Math.abs(tx.amount))}
                      </td>
                      <td>{tx.description}</td>
                      <td>{new Date(tx.date).toLocaleDateString('vi-VN')}</td>
                      <td><span className={`status-badge ${tx.status === 'success' ? 'success' : 'pending'}`}>
                        {tx.status === 'success' ? '✅' : '⏳'} {tx.status === 'success' ? 'Thành công' : 'Đang xử lý'}
                      </span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
