'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { blogPosts } from '@/lib/data';

export default function BlogsPage() {
  const [selected, setSelected] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const idStr = params.get('id');
      return idStr ? Number(idStr) : null;
    }
    return null;
  });

  const selectedPost = blogPosts.find(p => p.id === selected);

  return (
    <>
      <Header />
      <div className="main-content">
        <div className="section-title">📰 Bài Viết</div>

        {selected && selectedPost ? (
          <div className="dash-card" style={{ maxWidth: 800, margin: '0 auto' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setSelected(null)}
              style={{ marginBottom: 20 }}
            >
              ← Quay lại
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
              {selectedPost.title}
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              📅 {new Date(selectedPost.date).toLocaleDateString('vi-VN')}
            </div>
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 12,
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 64,
                marginBottom: 24,
              }}
            >
              📰
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
              {selectedPost.content}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {blogPosts.map(post => (
              <div
                key={post.id}
                className="dash-card"
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onClick={() => setSelected(post.id)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(99,102,241,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                }}
              >
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                  height: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 52,
                  marginBottom: 16,
                }}>
                  📰
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {post.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
                  {post.excerpt}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    📅 {new Date(post.date).toLocaleDateString('vi-VN')}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--accent-primary)', fontWeight: 600 }}>
                    Đọc thêm →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
