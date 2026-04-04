'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await login(username, password)) {
      router.push('/');
    }
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">🔐 Đăng Nhập</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
              <input type="text" className="form-input" value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập" required />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input type="password" className="form-input" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg">
              Đăng Nhập
            </button>
          </form>
          <div className="auth-footer">
            Chưa có tài khoản? <Link href="/client/register">Đăng ký ngay</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
