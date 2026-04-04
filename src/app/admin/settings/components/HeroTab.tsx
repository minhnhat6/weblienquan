'use client';

import { TabPanelProps, INPUT_STYLE, LABEL_STYLE } from './constants';

export function HeroTab({ settings, onUpdate }: TabPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8eaed', margin: 0 }}>
        Banner Trang Chủ
      </h2>
      <div>
        <label style={LABEL_STYLE}>Tiêu Đề Chính</label>
        <input 
          value={settings.heroTitle} 
          onChange={e => onUpdate('heroTitle', e.target.value)} 
          style={INPUT_STYLE} 
        />
      </div>
      <div>
        <label style={LABEL_STYLE}>Tiêu Đề Phụ</label>
        <input 
          value={settings.heroSubtitle} 
          onChange={e => onUpdate('heroSubtitle', e.target.value)} 
          style={INPUT_STYLE} 
        />
      </div>
      <BannerPreview title={settings.heroTitle} subtitle={settings.heroSubtitle} />
    </div>
  );
}

function BannerPreview({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0a0e1a, #1a1f35)', 
      borderRadius: 12, 
      padding: 32, 
      textAlign: 'center', 
      border: '1px solid rgba(99,102,241,0.2)' 
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>
        Preview
      </div>
      <h3 style={{ 
        fontSize: 22, fontWeight: 900, color: '#6366f1', 
        margin: '0 0 8px', textTransform: 'uppercase' 
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>{subtitle}</p>
    </div>
  );
}
