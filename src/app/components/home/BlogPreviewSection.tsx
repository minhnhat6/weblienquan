'use client';

/**
 * BlogPreviewSection - Shows recent blog posts on homepage
 */

import Link from 'next/link';
import Image from 'next/image';
import { blogPosts } from '@/lib/data';

const POSTS_TO_SHOW = 3;

const sectionStyle = { marginTop: 40, marginBottom: 40 };

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  borderBottom: '2px solid var(--border-color)',
  paddingBottom: 10,
  marginBottom: 20,
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 20,
};

const cardStyle = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  overflow: 'hidden',
  border: '1px solid var(--border-color)',
  textDecoration: 'none',
  color: 'var(--text-primary)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  display: 'flex',
  flexDirection: 'column' as const,
};

const imageContainerStyle = {
  position: 'relative' as const,
  height: 160,
  width: '100%',
  background: 'linear-gradient(135deg, rgba(94, 18, 129, 0.4), rgba(46, 17, 72, 0.8))',
};

function handleHover(e: React.MouseEvent<HTMLAnchorElement>, isEnter: boolean) {
  e.currentTarget.style.transform = isEnter ? 'translateY(-4px)' : 'translateY(0)';
  e.currentTarget.style.boxShadow = isEnter ? '0 8px 24px rgba(99,102,241,0.2)' : '';
}

interface BlogCardProps {
  post: typeof blogPosts[0];
}

function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/client/blogs?id=${post.id}`}
      style={cardStyle}
      onMouseEnter={(e) => handleHover(e, true)}
      onMouseLeave={(e) => handleHover(e, false)}
    >
      <div style={imageContainerStyle}>
        {post.image ? (
          <Image src={post.image} alt={post.title} fill loading="lazy" quality={75} sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 40 }}>
            📄
          </div>
        )}
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--accent-orange)', marginBottom: 8, fontWeight: 700 }}>
          {new Date(post.date).toLocaleDateString('vi-VN')}
        </div>
        <h3 style={{
          fontSize: 16,
          margin: '0 0 8px 0',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {post.title}
        </h3>
        <p style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.5,
        }}>
          {post.excerpt}
        </p>
      </div>
    </Link>
  );
}

export function BlogPreviewSection() {
  const postsToDisplay = blogPosts.slice(0, POSTS_TO_SHOW);

  return (
    <div className="blog-section" style={sectionStyle}>
      <div className="section-title" style={headerStyle}>
        <span>📰 Bài Viết Mới Nhất</span>
        <Link
          href="/client/blogs"
          style={{
            fontSize: 13,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Xem tất cả ➜
        </Link>
      </div>
      <div style={gridStyle}>
        {postsToDisplay.map(post => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
