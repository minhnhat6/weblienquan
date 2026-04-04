'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/data';

export default function RechargePage() {
  const { user, addPendingRecharge, showToast } = useAuth();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const safeUser = mounted ? user : null;
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [settings] = useState(() => {
    if (typeof window === 'undefined') {
      return { bankName: 'MB Bank', bankAccount: '1234567890', bankOwner: 'THAI VAN HIEU' };
    }
    const savedStr = localStorage.getItem('slq_site_settings');
    if (savedStr) {
      try {
        const parsed = JSON.parse(savedStr);
        return {
          bankName: parsed.bankName || 'MB Bank',
          bankAccount: parsed.bankAccount || '1234567890',
          bankOwner: parsed.bankOwner || 'THAI VAN HIEU'
        };
      } catch {
        return { bankName: 'MB Bank', bankAccount: '1234567890', bankOwner: 'THAI VAN HIEU' };
      }
    }
    return { bankName: 'MB Bank', bankAccount: '1234567890', bankOwner: 'THAI VAN HIEU' };
  });

  const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

  const handleRecharge = () => {
    if (!safeUser) return;
    const num = parseInt(amount);
    if (!num || num < 1000) {
      showToast('Số tiền tối thiểu là 1.000đ', 'error');
      return;
    }
    setShowQR(true);
  };

  const confirmReceived = () => {
    const num = parseInt(amount);
    if (!safeUser || !num || num < 1000) {
      showToast('Dữ liệu nạp tiền không hợp lệ.', 'error');
      return;
    }

    addPendingRecharge({
      id: 'RCH-' + Date.now(),
      userId: safeUser.id,
      username: safeUser.username,
      amount: num,
      method: 'bank',
      note: `NAP ${safeUser.username.toUpperCase()}`,
      date: new Date().toISOString(),
      status: 'pending',
    });
    showToast(`Đã gửi yêu cầu nạp ${formatPrice(num)}. Vui lòng chờ admin duyệt.`, 'info');
    setShowQR(false);
    setAmount('');
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-content" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        {!safeUser ? (
          <div className="empty-state">
            <div className="icon">🔒</div>
            <p>Vui lòng <Link href="/client/login" style={{ color: 'var(--accent-primary)' }}>đăng nhập</Link> để nạp tiền</p>
          </div>
        ) : (
          <>
            <div className="section-title">🏦 Nạp Tiền Qua Ngân Hàng</div>

            <div className="dash-card" style={{ marginBottom: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Số dư hiện tại</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>
                  {formatPrice(safeUser.balance)}
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="form-group">
                <label className="form-label">Nhập số tiền cần nạp</label>
                <input type="number" className="form-input" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Nhập số tiền (VNĐ)" min="1000" />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {quickAmounts.map(a => (
                  <button key={a} className={`btn btn-sm ${amount === String(a) ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setAmount(String(a))}>
                    {formatPrice(a)}
                  </button>
                ))}
              </div>

              {!showQR ? (
                <button className="btn btn-success btn-block btn-lg" onClick={handleRecharge}
                  disabled={!amount || parseInt(amount) < 1000}>
                  💳 Nạp Tiền
                </button>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: 12, color: 'var(--accent-primary)' }}>
                    Chuyển khoản {formatPrice(parseInt(amount))}
                  </h3>
                  <div className="qr-code">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
                      <div>QR Code</div>
                      <div style={{ fontSize: 10, marginTop: 4 }}>Quét để chuyển khoản</div>
                    </div>
                  </div>
                  <div style={{
                    background: 'var(--bg-secondary)', padding: 12, borderRadius: 8,
                    fontSize: 13, textAlign: 'left', marginBottom: 16
                  }}>
                    <p><strong>Ngân hàng:</strong> {settings.bankName}</p>
                    <p><strong>Số TK:</strong> {settings.bankAccount}</p>
                    <p><strong>Chủ TK:</strong> {settings.bankOwner}</p>
                    <p><strong>Số tiền:</strong> {formatPrice(parseInt(amount))}</p>
                    <p><strong>Nội dung CK:</strong> NAP {safeUser.username.toUpperCase()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-outline btn-block" onClick={() => setShowQR(false)}>Huỷ</button>
                    <button className="btn btn-success btn-block" onClick={confirmReceived}>
                      ✅ Đã chuyển khoản
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
                    * Yêu cầu sẽ chuyển sang trạng thái chờ duyệt để admin xử lý.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
