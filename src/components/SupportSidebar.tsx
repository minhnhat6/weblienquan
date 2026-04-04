/**
 * SupportSidebar Component
 * Floating support buttons for quick contact access
 */

'use client';

import { useSiteSettings } from '@/lib/settings';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ZALO_GROUP_LINK = 'https://zalo.me/g/ltishm122';

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SupportSidebar() {
  const { settings } = useSiteSettings();
  const phoneNumber = settings.hotline.replace(/\s+/g, '');

  return (
    <div className="support-sidebar">
      <a 
        href={settings.zaloLink} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="support-btn zalo" 
        title="Chat Zalo"
      >
        💬
      </a>
      <a 
        href={ZALO_GROUP_LINK} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="support-btn group" 
        title="Tham gia nhóm"
      >
        👥
      </a>
      <a 
        href={`tel:${phoneNumber}`} 
        className="support-btn phone" 
        title="Gọi Hotline"
      >
        📞
      </a>
    </div>
  );
}
