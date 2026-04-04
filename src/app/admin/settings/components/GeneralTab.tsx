'use client';

import { TabPanelProps, INPUT_STYLE, LABEL_STYLE } from './constants';

const GENERAL_FIELDS = [
  { key: 'siteName', label: 'Tên Website' },
  { key: 'hotline', label: 'Số Điện Thoại / Hotline' },
  { key: 'zaloLink', label: 'Link Zalo' },
  { key: 'facebookLink', label: 'Link Facebook' },
] as const;

export function GeneralTab({ settings, onUpdate }: TabPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8eaed', margin: 0 }}>
        Thông Tin Chung
      </h2>
      {GENERAL_FIELDS.map(field => (
        <div key={field.key}>
          <label style={LABEL_STYLE}>{field.label}</label>
          <input 
            value={settings[field.key] as string} 
            onChange={e => onUpdate(field.key, e.target.value)} 
            style={INPUT_STYLE} 
          />
        </div>
      ))}
    </div>
  );
}
