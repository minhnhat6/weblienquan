/**
 * Consignment Form Component
 * Form for submitting new consignment items
 */

'use client';

import { useCallback } from 'react';
import { 
  CATEGORIES, 
  INPUT_STYLE, 
  PricePreview, 
  ConsignmentForm as FormData,
  INITIAL_FORM,
} from './index';
import { cardStyle, primaryButtonStyle } from '@/lib/ui-styles';

interface ConsignmentFormProps {
  form: FormData;
  onSubmit: () => void;
  onUpdate: (key: keyof FormData, value: string) => void;
}

export function ConsignmentForm({ form, onSubmit, onUpdate }: ConsignmentFormProps) {
  const labelStyle = { 
    display: 'block', 
    fontSize: 12, 
    fontWeight: 600, 
    color: 'var(--text-muted)', 
    marginBottom: 6 
  };

  return (
    <div style={{ ...cardStyle, borderRadius: 12, padding: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
        📝 Thông Tin Ký Gửi
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title */}
        <div>
          <label style={labelStyle}>
            Tên tài khoản (VD: &quot;ACC Liên Quân 100 Skin VIP&quot;) *
          </label>
          <input 
            value={form.title} 
            onChange={e => onUpdate('title', e.target.value)} 
            placeholder="Nhập tên gợi nhớ..." 
            style={INPUT_STYLE} 
          />
        </div>

        {/* Category & Price row */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Game / Danh Mục</label>
            <select 
              value={form.categoryName} 
              onChange={e => onUpdate('categoryName', e.target.value)} 
              style={INPUT_STYLE}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Giá bạn muốn nhận (VNĐ) *</label>
            <input 
              type="number" 
              value={form.askPrice} 
              onChange={e => onUpdate('askPrice', e.target.value)} 
              placeholder="VD: 100000" 
              style={INPUT_STYLE} 
            />
          </div>
        </div>

        {/* Price Preview */}
        <PricePreview askPrice={form.askPrice} />

        {/* Description */}
        <div>
          <label style={labelStyle}>Mô tả (skin, rank, đặc điểm...)</label>
          <textarea 
            value={form.description} 
            onChange={e => onUpdate('description', e.target.value)} 
            placeholder="Mô tả chi tiết về acc: số skin, rank, server..." 
            rows={3} 
            style={{ ...INPUT_STYLE, resize: 'vertical' }} 
          />
        </div>

        {/* Account Data */}
        <div>
          <label style={labelStyle}>
            Thông tin tài khoản (username:password) * — chỉ admin &amp; người mua thấy
          </label>
          <textarea 
            value={form.accountData} 
            onChange={e => onUpdate('accountData', e.target.value)} 
            placeholder="taikhoan:matkhau&#10;Email: example@gmail.com&#10;Authen: ..." 
            rows={4} 
            style={{ ...INPUT_STYLE, fontFamily: 'monospace', resize: 'vertical' }} 
          />
        </div>

        {/* Security Notice */}
        <div style={{ 
          background: 'rgba(239,68,68,0.08)', 
          border: '1px solid rgba(239,68,68,0.2)', 
          borderRadius: 8, 
          padding: '10px 14px', 
          fontSize: 12, 
          color: '#ef4444' 
        }}>
          ⚠️ Thông tin ACC chỉ được tiết lộ sau khi người mua thanh toán thành công. Shop cam kết bảo mật tuyệt đối.
        </div>

        {/* Submit Button */}
        <button 
          onClick={onSubmit} 
          style={{ 
            ...primaryButtonStyle,
            padding: 12,
            borderRadius: 10,
            fontSize: 14,
          }}
        >
          🚀 Gửi Ký Gửi
        </button>
      </div>
    </div>
  );
}

export { INITIAL_FORM };
