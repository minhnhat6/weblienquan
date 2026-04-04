'use client';

import { TabPanelProps, INPUT_STYLE, LABEL_STYLE } from './constants';

const BANK_FIELDS = [
  { key: 'bankName', label: 'Tên Ngân Hàng', placeholder: 'VD: MB Bank, Vietcombank...' },
  { key: 'bankAccount', label: 'Số Tài Khoản', placeholder: '' },
  { key: 'bankOwner', label: 'Tên Chủ Tài Khoản', placeholder: '' },
] as const;

export function BankTab({ settings, onUpdate }: TabPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8eaed', margin: 0 }}>
        Thông Tin Ngân Hàng
      </h2>
      <InfoBanner />
      {BANK_FIELDS.map(field => (
        <div key={field.key}>
          <label style={LABEL_STYLE}>{field.label}</label>
          <input 
            value={settings[field.key] as string} 
            onChange={e => onUpdate(field.key, e.target.value)} 
            style={INPUT_STYLE}
            placeholder={field.placeholder} 
          />
        </div>
      ))}
    </div>
  );
}

function InfoBanner() {
  return (
    <div style={{ 
      background: 'rgba(16,185,129,0.08)', 
      border: '1px solid rgba(16,185,129,0.2)', 
      borderRadius: 8, 
      padding: 12, 
      fontSize: 12, 
      color: '#10b981' 
    }}>
      💡 Thông tin này sẽ hiển thị khi khách hàng nạp tiền qua ngân hàng.
    </div>
  );
}
