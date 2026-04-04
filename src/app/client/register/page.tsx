'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    const success = await register(username, email, password, referralCode);
    if (success) {
      router.push('/client/login');
    }
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">📝 Đăng Ký</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
              <input type="text" className="form-input" value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập" required minLength={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Nhập email" required />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input type="password" className="form-input" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu" required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Nhập lại mật khẩu</label>
              <input type="password" className="form-input" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu" required />
              {password !== confirmPassword && confirmPassword && (
                <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>
                  Mật khẩu không khớp!
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Mã giới thiệu (không bắt buộc)</label>
              <input type="text" className="form-input" value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
                placeholder="Nhập mã giới thiệu nếu có" />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg"
              disabled={password !== confirmPassword}>
              Đăng Ký
            </button>
          </form>
          <div className="auth-footer">
            Đã có tài khoản? <Link href="/client/login">Đăng nhập</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
