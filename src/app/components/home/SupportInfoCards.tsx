'use client';

/**
 * SupportInfoCards - Contact and support quick links
 */

import { useSiteSettings } from '@/lib/settings';

const ZALO_GROUP_LINK = 'https://zalo.me/g/ltishm122';

const cardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 18px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  textDecoration: 'none',
  color: 'var(--text-primary)',
  transition: 'all 0.2s',
} as const;

const iconStyle = { fontSize: 28 } as const;
const titleStyle = { fontWeight: 700, fontSize: 14 } as const;
const subtitleStyle = { fontSize: 12, color: 'var(--text-muted)' } as const;

interface SupportCardProps {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  isPhone?: boolean;
}

function SupportCard({ href, icon, title, subtitle, isPhone }: SupportCardProps) {
  const linkProps = isPhone ? {} : { target: '_blank', rel: 'noopener' as const };
  
  return (
    <a href={href} style={cardStyle} {...linkProps}>
      <span style={iconStyle}>{icon}</span>
      <div>
        <div style={titleStyle}>{title}</div>
        <div style={subtitleStyle}>{subtitle}</div>
      </div>
    </a>
  );
}

export function SupportInfoCards() {
  const { settings } = useSiteSettings();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 12,
      marginBottom: 24,
    }}>
      <SupportCard
        href={settings.zaloLink}
        icon="💬"
        title="Chat Zalo"
        subtitle="Tư vấn trực tiếp ngay"
      />
      <SupportCard
        href={ZALO_GROUP_LINK}
        icon="👥"
        title="Tham gia Nhóm"
        subtitle="Cập nhật tin tức mới"
      />
      <SupportCard
        href={`tel:${settings.hotline.replace(/\s+/g, '')}`}
        icon="📞"
        title="Hotline"
        subtitle={settings.hotline}
        isPhone
      />
    </div>
  );
}
