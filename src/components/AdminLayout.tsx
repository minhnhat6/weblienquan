/**
 * Admin Layout Component
 * Provides sidebar navigation and layout structure for admin pages
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth';
import ToastContainer from '@/components/ToastContainer';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

// ─── Navigation Config ─────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Tổng Quan', icon: '📊', exact: true },
  { href: '/admin/products', label: 'Sản Phẩm', icon: '📦' },
  { href: '/admin/orders', label: 'Đơn Hàng', icon: '📋' },
  { href: '/admin/users', label: 'Người Dùng', icon: '👥' },
  { href: '/admin/stock', label: 'Kho Tài Khoản', icon: '🗃️' },
  { href: '/admin/recharges', label: 'Duyệt Nạp Tiền', icon: '💰' },
  { href: '/admin/reconciliation', label: 'Đối Soát', icon: '🧮' },
  { href: '/admin/consignments', label: 'Ký Gửi ACC', icon: '🤝' },
  { href: '/admin/blog', label: 'Blog', icon: '✍️' },
  { href: '/admin/settings', label: 'Cài Đặt', icon: '⚙️' },
];

// ─── Styles ────────────────────────────────────────────────────────────────────

const SIDEBAR_STYLES = {
  width: 240,
  background: 'linear-gradient(180deg, #1a0b2e 0%, #3d1a6e 50%, #2a1b3d 100%)',
  borderRight: '1px solid rgba(192, 132, 224, 0.25)',
  display: 'flex' as const,
  flexDirection: 'column' as const,
  position: 'fixed' as const,
  left: 0,
  top: 0,
  bottom: 0,
  zIndex: 100,
  boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
};

const MAIN_STYLES = {
  display: 'flex',
  minHeight: '100vh',
  background: '#f4f4f8',
  backgroundImage: 'radial-gradient(circle, #c9b4e0 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      height: '100vh', background: '#1a0b2e', color: '#ffc107' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <p>Đang kiểm tra quyền...</p>
      </div>
    </div>
  );
}

function SidebarLogo() {
  return (
    <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(192,132,224,0.2)' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
        <Image
          src="/logo.png"
          alt="TaphoaACC"
          width={160}
          height={48}
          style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
          priority
        />
      </Link>
      <div style={{ 
        fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, 
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 
      }}>
        Admin Panel
      </div>
    </div>
  );
}

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

function NavLink({ item, isActive }: NavLinkProps) {
  return (
    <Link href={item.href} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 2,
      textDecoration: 'none', transition: 'all 0.15s',
      background: isActive ? 'rgba(255,193,7,0.15)' : 'transparent',
      color: isActive ? '#ffc107' : 'rgba(255,255,255,0.65)',
      borderLeft: isActive ? '3px solid #ffc107' : '3px solid transparent',
    }}>
      <span style={{ fontSize: 16 }}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

interface UserInfoProps {
  username: string;
  onLogout: () => void;
}

function UserInfo({ username, onLogout }: UserInfoProps) {
  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(192,132,224,0.2)' }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
        👤 <strong style={{ color: 'white' }}>{username}</strong>
        <span style={{ display: 'block', fontSize: 10, color: '#ffc107', fontWeight: 700, textTransform: 'uppercase' }}>
          Administrator
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Link href="/" style={{
          flex: 1, padding: '6px 8px', background: 'rgba(255,193,7,0.12)',
          border: '1px solid rgba(255,193,7,0.3)', borderRadius: 6,
          fontSize: 11, color: '#ffc107', textDecoration: 'none', textAlign: 'center', fontWeight: 700,
        }}>🌐 Website</Link>
        <button onClick={onLogout} style={{
          flex: 1, padding: '6px 8px', background: 'rgba(220,53,69,0.12)',
          border: '1px solid rgba(220,53,69,0.3)', borderRadius: 6,
          fontSize: 11, color: '#dc3545', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
        }}>🚪 Logout</button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { adminUser, logoutAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const safeUser = mounted ? adminUser : null;

  useEffect(() => {
    if (!mounted) return;
    if (!safeUser || safeUser.role !== 'admin') {
      router.replace('/admin/login');
    }
  }, [mounted, safeUser, router]);

  if (!mounted || !safeUser || safeUser.role !== 'admin') {
    return <LoadingScreen />;
  }

  return (
    <div style={MAIN_STYLES}>
      <ToastContainer />
      
      <aside style={SIDEBAR_STYLES}>
        <SidebarLogo />
        
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
            return <NavLink key={item.href} item={item} isActive={isActive} />;
          })}
        </nav>

        <UserInfo username={safeUser.username} onLogout={logoutAdmin} />
      </aside>

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
