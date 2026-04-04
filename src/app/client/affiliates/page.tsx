'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/data';

export default function AffiliatesPage() {
  const { user, showToast } = useAuth();

  if (!user) {
    return (
      <>
        <Header /><div className="main-content"><div className="empty-state"><div className="icon">🔒</div>
        <p>Vui lòng <a href="/client/login" style={{color:'var(--accent-primary)'}}>đăng nhập</a></p></div></div><Footer />
      </>
    );
  }

  const referralLink = `https://shoplienquan.com/?ref=${user.referralCode}`;

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-content" style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
        <div className="section-title">🤝 Tiếp Thị Liên Kết</div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">0</div>
            <div className="stat-label">Người đã giới thiệu</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatPrice(0)}</div>
            <div className="stat-label">Tổng hoa hồng</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">1.000đ</div>
            <div className="stat-label">Hoa hồng / lượt</div>
          </div>
        </div>

        <div className="dash-card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Link giới thiệu của bạn</h3>
          <div className="referral-link-box">
            <input readOnly value={referralLink} />
            <button className="btn btn-primary btn-sm" onClick={() => {
              navigator.clipboard.writeText(referralLink);
              showToast('Đã sao chép link giới thiệu!', 'success');
            }}>📋 Sao chép</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Mã giới thiệu: <strong style={{ color: 'var(--accent-primary)' }}>{user.referralCode}</strong>
          </p>
        </div>

        <div className="dash-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📖 Cách thức hoạt động</h3>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>1. Chia sẻ link giới thiệu của bạn cho bạn bè</p>
            <p>2. Bạn bè đăng ký qua link và nhập mã giới thiệu của bạn</p>
            <p>3. Bạn nhận được <strong style={{ color: 'var(--accent-green)' }}>1.000đ</strong> cho mỗi người đăng ký thành công</p>
            <p>4. Hoa hồng được cộng trực tiếp vào số dư tài khoản</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
