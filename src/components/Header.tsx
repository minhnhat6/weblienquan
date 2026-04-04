/**
 * Header Component
 * Main navigation bar with desktop and mobile menus
 */

'use client';

import { useState, useRef, useEffect, useSyncExternalStore, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSiteSettings } from '@/lib/settings';
import { categories, formatPrice } from '@/lib/data';

// ─── Constants ─────────────────────────────────────────────────────────────────

const SCROLL_THRESHOLD = 60;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
}

interface MegaMenuItem {
  title: string;
  links: NavItem[];
}

// ─── Menu Data ─────────────────────────────────────────────────────────────────

const MEGA_MENU_GROUPS: MegaMenuItem[] = [
  {
    title: '⚔️ Acc Random Liên Quân',
    links: [
      { href: '/?category=1', label: '⚔️ Liên Quân (Tất cả)' },
      { href: '/?category=5', label: '⭐ Bestseller' },
      { href: '/?category=4', label: '🔥 Siêu Sale' },
      { href: '/?category=7', label: '💎 Random VIP LQ' },
      { href: '/?category=6', label: '🏆 LQ Rank Cao' },
      { href: '/?category=10', label: '🆕 Hàng New' },
      { href: '/?category=9', label: '🎉 ACC 0K Free' },
    ],
  },
  {
    title: '📱 Liên Quân Theo Loại',
    links: [
      { href: '/?category=18', label: '📱 LQ Chưa Số' },
      { href: '/?category=3', label: '🎲 LQ Thập Cẩm' },
      { href: '/?category=14', label: '🔒 LQ Chủ Off' },
      { href: '/?category=16', label: '🔐 LQ Authen' },
      { href: '/?category=15', label: '📝 Nick Reg' },
      { href: '/?category=20', label: '📊 Data Thô LQ' },
      { href: '/?category=22', label: '📁 File LQ' },
    ],
  },
  {
    title: '🎁 Túi Mù & Skin Đặc Biệt',
    links: [
      { href: '/?category=2', label: '🎁 Túi Mù' },
      { href: '/?category=13', label: '✨ Random Skin SSS' },
      { href: '/?category=21', label: '🎭 Skin Anime Hợp Tác' },
      { href: '/?category=17', label: '🔄 Skin Chuyển Giao' },
      { href: '/?category=19', label: '🐚 Random Sò Quân Huy' },
      { href: '/?category=8', label: '🃏 TFT' },
    ],
  },
  {
    title: '🎮 Các Game Khác',
    links: [
      { href: '/?category=11', label: '🍎 Blox Fruits' },
      { href: '/?category=12', label: '⚽ FC Online' },
      { href: '/?category=23', label: '📲 Fc Mobile VN' },
      { href: '/?category=24', label: '🏎️ Zing Speed' },
      { href: '/?category=25', label: '🎯 Delta Force' },
      { href: '/?category=26', label: '🎮 Play Together' },
      { href: '/?category=27', label: '🏴‍☠️ Huyền Thoại Hải Tặc' },
    ],
  },
];

const PRICE_RANGES: NavItem[] = [
  { href: '/?price=0-50000', label: '💰 Dưới 50K' },
  { href: '/?price=50000-200000', label: '💰 Từ 50K - 200K' },
  { href: '/?price=200000-500000', label: '💰 Từ 200K - 500K' },
  { href: '/?price=500000-1000000', label: '💎 Từ 500K - 1 Triệu' },
  { href: '/?price=1000000-', label: '👑 Siêu VIP (Trên 1 Triệu)' },
];

const RANK_OPTIONS: NavItem[] = [
  { href: '/?rank=đồng', label: '🥉 Rank Đồng' },
  { href: '/?rank=bạc', label: '🥈 Rank Bạc' },
  { href: '/?rank=vàng', label: '🥇 Rank Vàng' },
  { href: '/?rank=bạch kim', label: '💠 Rank Bạch Kim' },
  { href: '/?rank=kim cương', label: '💎 Rank Kim Cương' },
  { href: '/?rank=tinh anh', label: '🔮 Rank Tinh Anh' },
  { href: '/?rank=cao thủ', label: '🛡️ Rank Cao Thủ' },
  { href: '/?rank=đại cao thủ', label: '🌟 Rank Đại Cao Thủ' },
  { href: '/?rank=chiến tướng', label: '🏆 Rank Chiến Tướng' },
];

const RECHARGE_MENU: NavItem[] = [
  { href: '/client/recharge', label: '🏦 Ngân Hàng' },
  { href: '/client/invoices', label: '📄 Hoá Đơn' },
  { href: '/client/nap-the', label: '💳 Nạp Thẻ' },
];

const OTHER_MENU: NavItem[] = [
  { href: '/client/blogs', label: '📰 Bài Viết' },
  { href: '/client/contact', label: '📞 Liên Hệ' },
  { href: '/client/privacy-policy', label: '🔒 Bảo Mật' },
  { href: '/client/terms', label: '📋 Điều Khoản' },
];

const MOBILE_NAV_LINKS: NavItem[] = [
  { href: '/', label: '🏠 Trang Chủ' },
  { href: '/client/orders', label: '📦 Lịch Sử Mua Hàng' },
  { href: '/client/affiliates', label: '🤝 Tiếp Thị Liên Kết' },
  { href: '/client/spin', label: '🎰 Vòng Quay Bonus' },
  { href: '/client/recharge', label: '🏦 Nạp Tiền Ngân Hàng' },
  { href: '/client/nap-the', label: '💳 Nạp Thẻ' },
  { href: '/client/invoices', label: '📄 Hoá Đơn' },
  { href: '/client/blogs', label: '📰 Bài Viết' },
  { href: '/client/contact', label: '📞 Liên Hệ' },
];

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function useScrollVisibility() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastScrollY.current && currentY > SCROLL_THRESHOLD;
      setVisible(!isScrollingDown);
      lastScrollY.current = currentY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return visible;
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function DropdownMenu({ items }: { items: NavItem[] }) {
  return (
    <div className="dropdown-menu">
      {items.map(item => (
        <Link key={item.href} href={item.href}>{item.label}</Link>
      ))}
    </div>
  );
}

function MegaMenu() {
  return (
    <div className="dropdown-menu mega-menu">
      {MEGA_MENU_GROUPS.map(group => (
        <div key={group.title} className="mega-group">
          <div className="mega-group-title">{group.title}</div>
          {group.links.map(link => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </div>
      ))}
    </div>
  );
}

interface UserDropdownProps {
  user: { username: string; balance: number; discount: number };
  onClose: () => void;
  onLogout: () => void;
}

function UserDropdown({ user, onClose, onLogout }: UserDropdownProps) {
  return (
    <div className="dropdown-menu" style={{
      display: 'block', position: 'absolute', right: 0, left: 'auto', top: '110%', minWidth: 180,
      background: 'var(--purple-dark)', border: '1px solid rgba(192, 132, 224, 0.3)',
      borderRadius: '10px', padding: '8px', zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <span style={{
        display: 'block', padding: '8px 12px', fontSize: 11,
        color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)'
      }}>
        Số dư: {formatPrice(user.balance)}<br />
        Giảm giá: {user.discount}%
      </span>
      <Link href="/client/orders" onClick={onClose}>📦 Đơn hàng</Link>
      <Link href="/client/recharge" onClick={onClose}>💰 Nạp tiền</Link>
      <Link href="/client/affiliates" onClick={onClose}>🤝 Tiếp thị</Link>
      <Link href="/client/spin" onClick={onClose}>🎰 Vòng quay</Link>
      <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); onClose(); }}
        style={{ color: 'var(--accent-red)' }}>🚪 Đăng xuất</a>
    </div>
  );
}

interface MobileNavProps {
  isOpen: boolean;
  user: { username: string; balance: number } | null;
  onClose: () => void;
  onLogout: () => void;
}

function MobileNav({ isOpen, user, onClose, onLogout }: MobileNavProps) {
  return (
    <div className={`mobile-nav ${isOpen ? 'open' : ''}`}>
      <button className="mobile-nav-close" onClick={onClose}>✕</button>
      
      {user && (
        <div style={{
          padding: '12px 0', marginBottom: 12,
          borderBottom: '1px solid var(--border-color)', fontSize: 14
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>👤 {user.username}</div>
          <div style={{ color: 'var(--accent-green)' }}>💰 {formatPrice(user.balance)}</div>
        </div>
      )}

      {MOBILE_NAV_LINKS.map(link => (
        <Link key={link.href} href={link.href} onClick={onClose}>{link.label}</Link>
      ))}

      <div style={{ padding: '12px 0', fontWeight: 600, color: 'var(--accent-primary)', fontSize: 13 }}>
        DANH MỤC SẢN PHẨM
      </div>
      {categories.map(cat => (
        <Link key={cat.id} href={`/?category=${cat.id}`} onClick={onClose}>
          {cat.icon} {cat.name}
        </Link>
      ))}

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        {!user ? (
          <>
            <Link href="/client/login" className="btn btn-outline btn-block" onClick={onClose}>Đăng Nhập</Link>
            <Link href="/client/register" className="btn btn-primary btn-block" onClick={onClose}>Đăng Ký</Link>
          </>
        ) : (
          <button className="btn btn-danger btn-block" onClick={() => { onLogout(); onClose(); }}>
            Đăng Xuất
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Header() {
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const mounted = useMounted();
  const visible = useScrollVisibility();
  const safeUser = mounted ? user : null;

  // Secure navigation handler using Next.js router
  const handleRechargeClick = useCallback(() => {
    router.push('/client/recharge');
  }, [router]);

  return (
    <>
      <header className="header" style={{
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease',
      }}>
        {/* Top Bar */}
        <div className="header-top">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span>🌐 Ngôn ngữ: Tiếng Việt</span>
            <span>💰 Tiền tệ: VND</span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span>📞 Hotline: {settings.hotline}</span>
            <span>⏰ Hỗ trợ 24/7</span>
          </div>
        </div>

        {/* Main Header */}
        <div className="header-main">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Image
              src="/logo.png"
              alt="TaphoaACC"
              width={160}
              height={48}
              style={{ objectFit: 'contain', maxHeight: '48px', width: 'auto' }}
              priority
            />
          </Link>

          <nav>
            <ul className="nav-links">
              <li><Link href="/">Trang Chủ</Link></li>
              <li className="dropdown">
                <a href="#menuSanPham">Mua Tài Khoản ▾</a>
                <MegaMenu />
              </li>
              <li className="dropdown">
                <a href="#menuGia">Acc Theo Giá ▾</a>
                <DropdownMenu items={PRICE_RANGES} />
              </li>
              <li className="dropdown">
                <a href="#menuRank">Acc Theo Rank ▾</a>
                <DropdownMenu items={RANK_OPTIONS} />
              </li>
              <li><Link href="/client/orders">Lịch Sử Mua</Link></li>
              <li><Link href="/client/affiliates">Tiếp Thị</Link></li>
              <li><Link href="/client/spin">Vòng Quay</Link></li>
              <li><Link href="/client/ky-gui">🤝 Ký Gửi</Link></li>
              <li className="dropdown">
                <a href="#">Nạp Tiền ▾</a>
                <DropdownMenu items={RECHARGE_MENU} />
              </li>
              <li className="dropdown">
                <a href="#">Khác ▾</a>
                <DropdownMenu items={OTHER_MENU} />
              </li>
            </ul>
          </nav>

          {/* Actions */}
          <div className="header-actions">
            {safeUser ? (
              <>
                <div className="wallet-badge" onClick={handleRechargeClick} role="button" tabIndex={0}>
                  💰 {formatPrice(safeUser.balance)}
                </div>
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setUserDropdown(!userDropdown)}
                  >
                    👤 {safeUser.username} ▾
                  </button>
                  {userDropdown && (
                    <UserDropdown 
                      user={safeUser} 
                      onClose={() => setUserDropdown(false)} 
                      onLogout={logout} 
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/client/login" className="btn btn-outline btn-sm">Đăng Nhập</Link>
                <Link href="/client/register" className="btn btn-primary btn-sm">Đăng Ký</Link>
              </>
            )}
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>☰</button>
          </div>
        </div>
      </header>

      <MobileNav 
        isOpen={mobileOpen} 
        user={safeUser} 
        onClose={() => setMobileOpen(false)} 
        onLogout={logout} 
      />
    </>
  );
}
