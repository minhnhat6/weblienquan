'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/data';

export default function NapThePage() {
  const { user, addPendingRecharge, showToast } = useAuth();
  const [telco, setTelco] = useState('');
  const [serial, setSerial] = useState('');
  const [code, setCode] = useState('');
  const [faceValue, setFaceValue] = useState('');
  const [loading, setLoading] = useState(false);

  const telcos = [
    { id: 'viettel', name: 'Viettel', color: '#e60012' },
    { id: 'mobifone', name: 'Mobifone', color: '#0066b3' },
    { id: 'vinaphone', name: 'Vinaphone', color: '#005baa' },
    { id: 'vietnamobile', name: 'Vietnamobile', color: '#ffd700' },
    { id: 'garena', name: 'Garena', color: '#ff6600' },
  ];

  const faceValues = [10000, 20000, 50000, 100000, 200000, 500000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !telco || !serial || !code || !faceValue) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const amount = parseInt(faceValue);
      addPendingRecharge({
        id: 'RCH-' + Date.now(),
        userId: user.id,
        username: user.username,
        amount,
        method: 'card',
        note: `${telcos.find(t => t.id === telco)?.name || 'Card'} | Serial: ${serial}`,
        date: new Date().toISOString(),
        status: 'pending',
      });
      showToast(`Đã gửi yêu cầu nạp thẻ ${formatPrice(amount)}. Vui lòng chờ admin duyệt.`, 'info');
      setLoading(false);
      setSerial('');
      setCode('');
    }, 2000);
  };

  if (!user) {
    return (
      <>
        <Header /><div className="main-content"><div className="empty-state"><div className="icon">🔒</div>
        <p>Vui lòng <a href="/client/login" style={{color:'var(--accent-primary)'}}>đăng nhập</a> để nạp thẻ</p></div></div><Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-content" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        <div className="section-title">💳 Nạp Thẻ Cào</div>

        <div className="dash-card" style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Số dư hiện tại</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>{formatPrice(user.balance)}</div>
        </div>

        <div className="dash-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Chọn nhà mạng</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {telcos.map(t => (
                  <button type="button" key={t.id}
                    className={`btn btn-sm ${telco === t.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setTelco(t.id)}
                    style={telco === t.id ? { background: t.color } : {}}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mệnh giá</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {faceValues.map(v => (
                  <button type="button" key={v}
                    className={`btn btn-sm ${faceValue === String(v) ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFaceValue(String(v))}>
                    {formatPrice(v)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Số serial</label>
              <input type="text" className="form-input" value={serial}
                onChange={e => setSerial(e.target.value)} placeholder="Nhập số serial thẻ" required />
            </div>

            <div className="form-group">
              <label className="form-label">Mã thẻ</label>
              <input type="text" className="form-input" value={code}
                onChange={e => setCode(e.target.value)} placeholder="Nhập mã thẻ cào" required />
            </div>

            <button type="submit" className="btn btn-success btn-block btn-lg" disabled={loading}>
              {loading ? '⏳ Đang xử lý...' : '💳 Nạp Thẻ'}
            </button>
          </form>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
            * Yêu cầu nạp thẻ sẽ chuyển sang chờ duyệt để admin xử lý.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
