'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ToastContainer from '@/components/ToastContainer';
import { useAuth } from '@/lib/auth';

export default function AdminLoginPage() {
  const { loginAdmin } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await loginAdmin(username, password)) {
      router.push('/admin');
    }
  };

  return (
    <>
      <ToastContainer />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle, #2a1b3d 0%, #1a0b2e 100%)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(192, 132, 224, 0.2)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          color: 'white',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Admin Panel
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>Đăng nhập hệ thống quản trị</p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'rgba(255,255,255,0.8)' }}>
                Tên đăng nhập
              </label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px', 
                  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(192, 132, 224, 0.3)',
                  color: 'white', outline: 'none', fontSize: '14px'
                }}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'rgba(255,255,255,0.8)' }}>
                Mật khẩu
              </label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px', 
                  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(192, 132, 224, 0.3)',
                  color: 'white', outline: 'none', fontSize: '14px'
                }}
                required 
              />
            </div>
            <button 
              type="submit" 
              style={{
                background: 'linear-gradient(135deg, #ffc107, #d4a017)',
                color: '#1a1a1a', fontWeight: 'bold', padding: '12px', borderRadius: '8px',
                border: 'none', cursor: 'pointer', fontSize: '15px', marginTop: '8px',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                transition: 'all 0.2s'
              }}
            >
              Đăng Nhập Quản Trị
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none' }}>
              &larr; Quay lại cửa hàng
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
