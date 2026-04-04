/**
 * Footer Component
 * Site footer with links and contact information
 */

'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/lib/settings';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

// ─── Link Data ─────────────────────────────────────────────────────────────────

const QUICK_LINKS: FooterLink[] = [
  { href: '/', label: 'Trang Chủ' },
  { href: '/client/ky-gui', label: '🤝 Ký Gửi ACC' },
  { href: '/client/blogs', label: 'Bài Viết' },
  { href: '/client/contact', label: 'Liên Hệ' },
  { href: '/client/spin', label: 'Vòng Quay Bonus' },
];

const POLICY_LINKS: FooterLink[] = [
  { href: '/client/privacy-policy', label: 'Chính sách bảo mật' },
  { href: '/client/terms', label: 'Điều khoản sử dụng' },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
}

function FooterSection({ title, children }: FooterSectionProps) {
  return (
    <div className="footer-section">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function FooterLinks({ links }: { links: FooterLink[] }) {
  return (
    <ul className="footer-links">
      {links.map(link => (
        <li key={link.href}>
          {link.external ? (
            <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
          ) : (
            <Link href={link.href}>{link.label}</Link>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Footer() {
  const { settings } = useSiteSettings();
  const currentYear = new Date().getFullYear();
  
  const supportLinks: FooterLink[] = [
    { href: settings.zaloLink, label: 'Chat Zalo', external: true },
    { href: `tel:${settings.hotline.replace(/\s+/g, '')}`, label: `Hotline: ${settings.hotline}`, external: true },
    { href: 'https://zalo.me/g/ltishm122', label: 'Nhóm Zalo', external: true },
  ];

  return (
    <footer className="footer">
      <div className="footer-content">
        <FooterSection title={`🏪 ${settings.siteName}`}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {settings.siteName} - Mua bán tài khoản game giá rẻ, uy tín.
            Liên Quân, TFT, Blox Fruits, FC Online và nhiều game khác.
          </p>
        </FooterSection>

        <FooterSection title="Liên Kết Nhanh">
          <FooterLinks links={QUICK_LINKS} />
        </FooterSection>

        <FooterSection title="Chính Sách">
          <FooterLinks links={POLICY_LINKS} />
        </FooterSection>

        <FooterSection title="Hỗ Trợ">
          <FooterLinks links={supportLinks} />
        </FooterSection>
      </div>
      
      <div className="footer-bottom">
        © {currentYear} {settings.siteName}. All rights reserved.
      </div>
    </footer>
  );
}
