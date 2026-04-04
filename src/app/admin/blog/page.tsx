'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/lib/auth';
import { BlogPost } from '@/lib/data';

const STORAGE_KEY = 'slq_blog_override';

const defaultPosts: BlogPost[] = [
  { id: 1, title: 'Cách sử dụng acc sò, quân huy', slug: 'cach-su-dung-acc', excerpt: 'Hướng dẫn chi tiết cách sử dụng tài khoản sau khi mua.', content: 'Nội dung bài viết...', image: '', author: 'Admin', date: '2025-08-16', category: 'Hướng dẫn' },
  { id: 2, title: 'Feedback ShopRandom247.com', slug: 'feedback-shop', excerpt: 'Phản hồi từ khách hàng về dịch vụ của chúng tôi.', content: 'Nội dung bài viết...', image: '', author: 'Admin', date: '2025-07-28', category: 'Tin tức' },
  { id: 3, title: 'Làm Tiếp Thị Liên Kết', slug: 'lam-tiep-thi', excerpt: 'Lợi ích khi bạn làm CTV tiếp thị liên kết.', content: 'Nội dung bài viết...', image: '', author: 'Admin', date: '2025-06-26', category: 'Tiếp thị' },
  { id: 4, title: 'Hướng dẫn đổi authen', slug: 'doi-authen', excerpt: 'Hướng dẫn đổi authen cho tài khoản mua tại shop.', content: 'Nội dung bài viết...', image: '', author: 'Admin', date: '2025-06-26', category: 'Hướng dẫn' },
  { id: 5, title: 'Định Dạng Thông Tin', slug: 'dinh-dang-thong-tin', excerpt: 'Cách đọc và hiểu định dạng thông tin tài khoản.', content: 'Nội dung bài viết...', image: '', author: 'Admin', date: '2025-05-10', category: 'Hướng dẫn' },
];

export default function AdminBlog() {
  const { showToast } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    if (typeof window === 'undefined') return defaultPosts;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultPosts;
  });
  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', category: 'Hướng dẫn', author: 'Admin' });
  const [preview, setPreview] = useState<BlogPost | null>(null);

  const savePosts = (p: BlogPost[]) => {
    setPosts(p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  };

  const openAdd = () => {
    setEditPost(null);
    setForm({ title: '', excerpt: '', content: '', category: 'Hướng dẫn', author: 'Admin' });
    setShowModal(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditPost(p);
    setForm({
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      category: p.category || 'Hướng dẫn',
      author: p.author || 'Admin',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { showToast('Vui lòng nhập tiêu đề!', 'error'); return; }
    if (editPost) {
      savePosts(posts.map(p => p.id === editPost.id ? { ...p, ...form } : p));
      showToast('Đã cập nhật bài viết!', 'success');
    } else {
      const slug = form.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const newPost: BlogPost = { id: Date.now(), slug, image: '', date: new Date().toISOString().split('T')[0], ...form };
      savePosts([newPost, ...posts]);
      showToast('Đã thêm bài viết mới!', 'success');
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Xóa bài viết này?')) return;
    savePosts(posts.filter(p => p.id !== id));
    showToast('Đã xóa bài viết!', 'success');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', background: '#111827',
    border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8,
    color: '#e8eaed', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };

  const catColors: Record<string, string> = {
    'Hướng dẫn': '#06b6d4', 'Tin tức': '#8b5cf6', 'Tiếp thị': '#f59e0b', 'Khác': '#6b7280',
  };

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaed' }}>✍️ Quản Lý Blog</h1>
          <button onClick={openAdd} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Viết Bài Mới
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {posts.map(p => (
            <div key={p.id} style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 700, background: `${catColors[p.category || 'Khác'] || '#6b7280'}22`, color: catColors[p.category || 'Khác'] || '#6b7280' }}>{p.category || 'Khác'}</span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>📅 {p.date}</span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>✍️ {p.author || 'Admin'}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8eaed', marginBottom: 6 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>{p.excerpt}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setPreview(p)} style={{ padding: '7px 12px', background: 'rgba(6,182,212,0.2)', border: 'none', borderRadius: 8, color: '#06b6d4', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>👁️</button>
                <button onClick={() => openEdit(p)} style={{ padding: '7px 12px', background: 'rgba(99,102,241,0.2)', border: 'none', borderRadius: 8, color: '#6366f1', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>✏️</button>
                <button onClick={() => handleDelete(p.id)} style={{ padding: '7px 12px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 8, color: '#ef4444', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit/Add Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e8eaed', marginBottom: 20 }}>
                {editPost ? '✏️ Sửa Bài Viết' : '📝 Viết Bài Mới'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Tiêu Đề *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nhập tiêu đề bài viết" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Danh Mục</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                      {['Hướng dẫn', 'Tin tức', 'Tiếp thị', 'Khác'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Tác Giả</label>
                    <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Admin" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Tóm Tắt</label>
                  <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Một đoạn mô tả ngắn..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Nội Dung</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Viết nội dung bài viết..." rows={8} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Huỷ</button>
                  <button onClick={handleSave} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
                    {editPost ? '✅ Lưu' : '🚀 Đăng Bài'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {preview && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => e.target === e.currentTarget && setPreview(null)}>
            <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 700, background: `${catColors[preview.category || 'Khác'] || '#6b7280'}22`, color: catColors[preview.category || 'Khác'] || '#6b7280' }}>{preview.category || 'Khác'}</span>
                <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 18, cursor: 'pointer' }}>✕</button>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e8eaed', marginBottom: 8 }}>{preview.title}</h2>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>📅 {preview.date} · ✍️ {preview.author || 'Admin'}</div>
              <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>{preview.excerpt}</p>
              <div style={{ fontSize: 14, color: '#e8eaed', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{preview.content}</div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
