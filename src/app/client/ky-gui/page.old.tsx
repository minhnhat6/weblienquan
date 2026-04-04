'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, ConsignmentItem } from '@/lib/auth';
import { formatPrice } from '@/lib/data';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';

// Constants
const CATEGORIES = ['Liên Quân', 'TFT', 'Blox Fruits', 'FC Online', 'FC Mobile', 'Zing Speed', 'Delta Force', 'Play Together', 'Hải Tặc', 'Khác'];
const FEE_PERCENT = 20;
const SELLER_PERCENT = 100 - FEE_PERCENT;

const STATUS_CONFIG = {
  pending:  { label: '⏳ Chờ duyệt',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  approved: { label: '✅ Đang bán',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  rejected: { label: '❌ Từ chối',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  sold:     { label: '💰 Đã bán',     color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
} as const;

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
};

const INITIAL_FORM = {
  title: '',
  description: '',
  categoryName: 'Liên Quân',
  accountData: '',
  askPrice: '',
};

type TabType = 'list' | 'submit';

/** Feature highlight cards for hero section */
function FeatureCards() {
  const features = [
    { icon: '🔒', label: 'An Toàn', sub: 'Shop làm trung gian' },
    { icon: '💰', label: `${SELLER_PERCENT}% cho bạn`, sub: 'Nhận tiền ngay ví' },
    { icon: '⚡', label: 'Nhanh Chóng', sub: 'Duyệt trong 24h' },
  ];

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {features.map(f => (
        <div key={f.label} style={{ 
          background: 'rgba(99,102,241,0.1)', 
          border: '1px solid rgba(99,102,241,0.2)', 
          borderRadius: 10, 
          padding: '12px 16px', 
          textAlign: 'center', 
          minWidth: 110 
        }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>{f.icon}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>{f.label}</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>{f.sub}</div>
        </div>
      ))}
    </div>
  );
}

/** Hero banner section */
function HeroBanner() {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #1a1f35, #111827)', 
      border: '1px solid rgba(99,102,241,0.3)', 
      borderRadius: 16, 
      padding: '28px 32px', 
      marginBottom: 28, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      flexWrap: 'wrap', 
      gap: 16 
    }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#e8eaed', marginBottom: 8 }}>
          🤝 Ký Gửi Tài Khoản
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, maxWidth: 500 }}>
          Ký gửi tài khoản game lên shop để bán trung gian. Shop thu{' '}
          <strong style={{ color: '#f59e0b' }}>{FEE_PERCENT}% phí</strong>, 
          bạn nhận phần còn lại ngay khi acc được bán thành công!
        </p>
      </div>
      <FeatureCards />
    </div>
  );
}

/** Tab switcher component */
function TabSwitcher({ tab, onChange }: { tab: TabType; onChange: (t: TabType) => void }) {
  const tabs = [
    { id: 'list' as const, label: '📋 Danh Sách Đang Bán' },
    { id: 'submit' as const, label: '+ Ký Gửi Mới' },
  ];

  return (
    <div style={{ 
      display: 'flex', gap: 4, marginBottom: 20, 
      background: 'var(--bg-secondary)', padding: 4, 
      borderRadius: 10, width: 'fit-content' 
    }}>
      {tabs.map(t => (
        <button 
          key={t.id} 
          onClick={() => onChange(t.id)} 
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: tab === t.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
            color: tab === t.id ? 'white' : 'var(--text-secondary)',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Price preview component */
function PricePreview({ askPrice }: { askPrice: string }) {
  if (!askPrice) return null;
  const amount = Number(askPrice);
  const salePrice = Math.ceil(amount / (1 - FEE_PERCENT / 100));

  return (
    <div style={{ 
      background: 'rgba(99,102,241,0.08)', 
      border: '1px solid rgba(99,102,241,0.2)', 
      borderRadius: 8, 
      padding: '10px 14px', 
      fontSize: 13, 
      display: 'flex', 
      gap: 20 
    }}>
      <span>💰 Bạn nhận: <strong style={{ color: '#10b981' }}>{formatPrice(amount)}</strong></span>
      <span>🏷️ Giá bán: <strong style={{ color: '#f59e0b' }}>{formatPrice(salePrice)}</strong></span>
      <span style={{ color: '#6b7280' }}>Shop: {FEE_PERCENT}%</span>
    </div>
  );
}

/** Listing card for public view */
function ListingCard({ item }: { item: ConsignmentItem }) {
  return (
    <div style={{ 
      background: 'var(--bg-card)', 
      border: '1px solid var(--border-color)', 
      borderRadius: 12, 
      padding: 20, 
      display: 'flex', 
      justifyContent: 'space-between', 
      gap: 16 
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <span style={{ 
            fontSize: 11, padding: '2px 8px', borderRadius: 8, 
            background: 'rgba(99,102,241,0.2)', color: '#6366f1', fontWeight: 700 
          }}>
            {item.categoryName}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {item.id}</span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          {item.title}
        </h3>
        {item.description && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
            {item.description}
          </p>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          👤 Người bán: {item.username} · 📅 {new Date(item.submitDate).toLocaleDateString('vi-VN')}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>
          {formatPrice(item.salePrice)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Giá bán</div>
        <Link 
          href="/client/login" 
          style={{ 
            display: 'inline-block', padding: '8px 16px', 
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
            color: 'white', borderRadius: 8, textDecoration: 'none', 
            fontSize: 12, fontWeight: 700 
          }}
        >
          Mua Ngay
        </Link>
      </div>
    </div>
  );
}

/** My listing item card */
function MyListingCard({ 
  item, 
  onDelete 
}: { 
  item: ConsignmentItem; 
  onDelete: (id: string) => void;
}) {
  const status = STATUS_CONFIG[item.status];
  const canDelete = item.status === 'pending' || item.status === 'rejected';

  return (
    <div style={{ 
      background: 'var(--bg-secondary)', 
      borderRadius: 8, 
      padding: 12, 
      border: `1px solid ${status.color}33` 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ 
          fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', 
          flex: 1, marginRight: 8, overflow: 'hidden', 
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
        }}>
          {item.title}
        </span>
        <span style={{ 
          fontSize: 10, padding: '2px 6px', borderRadius: 6, 
          background: status.bg, color: status.color, fontWeight: 700, flexShrink: 0 
        }}>
          {status.label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Nhận: <strong style={{ color: '#10b981' }}>{formatPrice(item.askPrice)}</strong></span>
        {item.status === 'rejected' && item.rejectReason && (
          <span style={{ color: '#ef4444' }}>Lý do: {item.rejectReason}</span>
        )}
        {canDelete && (
          <button 
            onClick={() => onDelete(item.id)} 
            style={{ 
              background: 'none', border: 'none', color: '#ef4444', 
              fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' 
            }}
          >
            🗑️ Xóa
          </button>
        )}
      </div>
    </div>
  );
}

/** Instructions panel for logged out users */
function InstructionsPanel() {
  const steps = [
    'Đăng nhập vào tài khoản',
    'Điền thông tin acc & giá muốn nhận',
    'Đợi admin duyệt (trong 24h)',
    'Acc được đăng bán, khách mua → bạn nhận tiền',
  ];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
        📋 Hướng Dẫn
      </h2>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span style={{ 
            background: 'rgba(99,102,241,0.2)', color: '#6366f1', 
            width: 22, height: 22, borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontWeight: 700, fontSize: 11, flexShrink: 0 
          }}>
            {i + 1}
          </span>
          {step}
        </div>
      ))}
    </div>
  );
}

export default function KyGuiPage() {
  const { user, getConsignments, submitConsignment, deleteConsignment } = useAuth();
  const [tab, setTab] = useState<TabType>('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  
  const myItems = refreshKey >= 0 && user ? getConsignments(user.id) : [];
  const pendingListings = refreshKey >= 0 ? getConsignments().filter(c => c.status === 'approved') : [];
  const earned = myItems.filter(c => c.status === 'sold').reduce((s, c) => s + c.askPrice, 0);

  const handleSubmit = useCallback(() => {
    if (!user) { alert('Vui lòng đăng nhập!'); return; }
    if (!form.title || !form.accountData || !form.askPrice) {
      alert('Vui lòng điền đầy đủ thông tin!'); return;
    }
    submitConsignment({
      userId: user.id, 
      username: user.username,
      title: form.title, 
      description: form.description,
      categoryName: form.categoryName,
      accountData: form.accountData,
      askPrice: Number(form.askPrice),
      images: '',
    });
    setForm(INITIAL_FORM);
    setTab('list');
    setRefreshKey(k => k + 1);
  }, [user, form, submitConsignment]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm('Hủy ký gửi này?')) return;
    deleteConsignment(id);
    setRefreshKey(k => k + 1);
  }, [deleteConsignment]);

  const updateForm = useCallback((key: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  }, []);

  return (
    <div>
      <Header />
      <ToastContainer />
      <div className="main-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <HeroBanner />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          {/* Main area */}
          <div>
            <TabSwitcher tab={tab} onChange={setTab} />

            {/* Submit form */}
            {tab === 'submit' && (
              user ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
                    📝 Thông Tin Ký Gửi
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                        Tên tài khoản (VD: &quot;ACC Liên Quân 100 Skin VIP&quot;) *
                      </label>
                      <input 
                        value={form.title} 
                        onChange={e => updateForm('title', e.target.value)} 
                        placeholder="Nhập tên gợi nhớ..." 
                        style={INPUT_STYLE} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                          Game / Danh Mục
                        </label>
                        <select 
                          value={form.categoryName} 
                          onChange={e => updateForm('categoryName', e.target.value)} 
                          style={INPUT_STYLE}
                        >
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                          Giá bạn muốn nhận (VNĐ) *
                        </label>
                        <input 
                          type="number" 
                          value={form.askPrice} 
                          onChange={e => updateForm('askPrice', e.target.value)} 
                          placeholder="VD: 100000" 
                          style={INPUT_STYLE} 
                        />
                      </div>
                    </div>
                    <PricePreview askPrice={form.askPrice} />
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                        Mô tả (skin, rank, đặc điểm...)
                      </label>
                      <textarea 
                        value={form.description} 
                        onChange={e => updateForm('description', e.target.value)} 
                        placeholder="Mô tả chi tiết về acc: số skin, rank, server..." 
                        rows={3} 
                        style={{ ...INPUT_STYLE, resize: 'vertical' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                        Thông tin tài khoản (username:password) * — chỉ admin &amp; người mua thấy
                      </label>
                      <textarea 
                        value={form.accountData} 
                        onChange={e => updateForm('accountData', e.target.value)} 
                        placeholder="taikhoan:matkhau&#10;Email: example@gmail.com&#10;Authen: ..." 
                        rows={4} 
                        style={{ ...INPUT_STYLE, fontFamily: 'monospace', resize: 'vertical' }} 
                      />
                    </div>
                    <div style={{ 
                      background: 'rgba(239,68,68,0.08)', 
                      border: '1px solid rgba(239,68,68,0.2)', 
                      borderRadius: 8, 
                      padding: '10px 14px', 
                      fontSize: 12, 
                      color: '#ef4444' 
                    }}>
                      ⚠️ Thông tin ACC chỉ được tiết lộ sau khi người mua thanh toán thành công. Shop cam kết bảo mật tuyệt đối.
                    </div>
                    <button 
                      onClick={handleSubmit} 
                      style={{ 
                        padding: '12px', 
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                        border: 'none', 
                        borderRadius: 10, 
                        color: 'white', 
                        fontSize: 14, 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        fontFamily: 'inherit' 
                      }}
                    >
                      🚀 Gửi Ký Gửi
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 12, 
                  padding: 40, 
                  textAlign: 'center', 
                  color: 'var(--text-muted)' 
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                  <p style={{ marginBottom: 16 }}>Vui lòng đăng nhập để ký gửi tài khoản</p>
                  <Link 
                    href="/client/login" 
                    style={{ 
                      display: 'inline-block', 
                      padding: '10px 24px', 
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                      color: 'white', 
                      borderRadius: 8, 
                      textDecoration: 'none', 
                      fontWeight: 600 
                    }}
                  >
                    Đăng Nhập
                  </Link>
                </div>
              )
            )}

            {/* Public listing */}
            {tab === 'list' && (
              <div>
                <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                  {pendingListings.length} tài khoản đang được ký gửi
                </div>
                {pendingListings.length === 0 ? (
                  <div style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 12, 
                    padding: 40, 
                    textAlign: 'center', 
                    color: 'var(--text-muted)' 
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                    <p>Chưa có tài khoản ký gửi nào. Hãy là người đầu tiên!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pendingListings.map(c => <ListingCard key={c.id} item={c} />)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: My listings or Instructions */}
          <div>
            {user ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  📦 Ký Gửi Của Tôi
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Đã kiếm được</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{formatPrice(earned)}</span>
                </div>
                
                {/* Status stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                  {(['pending', 'approved', 'sold', 'rejected'] as const).map(s => {
                    const status = STATUS_CONFIG[s];
                    const count = myItems.filter(c => c.status === s).length;
                    return (
                      <div key={s} style={{ 
                        background: status.bg, 
                        border: `1px solid ${status.color}33`, 
                        borderRadius: 8, 
                        padding: '8px 10px', 
                        textAlign: 'center' 
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: status.color }}>{count}</div>
                        <div style={{ fontSize: 10, color: status.color }}>{status.label}</div>
                      </div>
                    );
                  })}
                </div>

                {myItems.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
                    Chưa có ký gửi nào.
                    <button 
                      onClick={() => setTab('submit')} 
                      style={{ 
                        display: 'block', margin: '8px auto 0', 
                        color: '#6366f1', background: 'none', border: 'none', 
                        cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' 
                      }}
                    >
                      + Ký gửi ngay
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                    {myItems.map(c => (
                      <MyListingCard key={c.id} item={c} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <InstructionsPanel />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
