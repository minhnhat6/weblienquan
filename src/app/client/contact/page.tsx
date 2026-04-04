'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import { useAuth } from '@/lib/auth';

export default function ContactPage() {
  const { showToast } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm.', 'success');
    setName('');
    setEmail('');
    setMessage('');
  };

  const contacts = [
    {
      icon: '💬',
      label: 'Zalo Hỗ Trợ',
      value: '0334 622 902',
      desc: 'Chat trực tiếp qua Zalo, phản hồi trong vài phút',
      link: 'https://zalo.me/0334622902',
      color: '#06b6d4',
    },
    {
      icon: '👥',
      label: 'Nhóm Zalo',
      value: 'Tham gia nhóm',
      desc: 'Nhóm Zalo cập nhật khuyến mãi và tin tức mới nhất',
      link: 'https://zalo.me/g/ltishm122',
      color: '#6366f1',
    },
    {
      icon: '📘',
      label: 'Facebook',
      value: 'Thái Văn Hiếu',
      desc: 'Kết nối Facebook để được hỗ trợ nhanh chóng',
      link: 'https://facebook.com',
      color: '#3b82f6',
    },
    {
      icon: '📞',
      label: 'Hotline',
      value: '0334 622 902',
      desc: 'Gọi điện trực tiếp (8:00 - 22:00 mỗi ngày)',
      link: 'tel:0334622902',
      color: '#10b981',
    },
  ];

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-content">
        <div className="section-title">📞 Liên Hệ</div>

        {/* Contact Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}>
          {contacts.map((c, i) => (
            <a
              key={i}
              href={c.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: '20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 24px ${c.color}33`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.transform = '';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '';
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: `${c.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                border: `1.5px solid ${c.color}55`,
              }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontWeight: 600, color: c.color, fontSize: 14, marginBottom: 4 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Contact Form */}
        <div className="dash-card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>✉️ Gửi Tin Nhắn</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nhập họ và tên của bạn"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nội dung</label>
              <textarea
                className="form-input"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Nhập nội dung cần hỗ trợ..."
                rows={5}
                required
                style={{ resize: 'vertical', minHeight: 120 }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg">
              📨 Gửi Tin Nhắn
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div style={{
          maxWidth: 600,
          margin: '24px auto 0',
          padding: 16,
          borderRadius: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          fontSize: 13,
          color: 'var(--text-muted)',
          textAlign: 'center',
          lineHeight: 1.7,
        }}>
          ⏰ Thời gian hỗ trợ: <strong style={{ color: 'var(--text-primary)' }}>8:00 - 22:00</strong> hàng ngày<br />
          📍 Phản hồi qua Zalo thường <strong style={{ color: 'var(--accent-green)' }}>nhanh nhất</strong> (trong vài phút)
        </div>
      </div>
      <Footer />
    </>
  );
}
