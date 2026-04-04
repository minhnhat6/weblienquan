'use client';

import Image from 'next/image';
import { Product, categories } from '@/lib/data';
import { 
  INPUT_STYLE, 
  BASIC_FIELDS, 
  STATS_FIELDS, 
  RANK_OPTIONS,
  ProductFormState 
} from './constants';

interface ProductModalProps {
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  editingProduct: Product | null;
  isUploading: boolean;
  onFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>, 
    targetKey: keyof ProductFormState, 
    singleFile?: boolean
  ) => void;
  onSave: () => void;
  onClose: () => void;
}

/** Image upload section with preview */
function ImageUploadSection({
  image,
  isUploading,
  onImageChange,
  onFileUpload,
}: {
  image: string;
  isUploading: boolean;
  onImageChange: (url: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div style={{ borderTop: '1px solid rgba(99,102,241,0.2)', paddingTop: 14 }}>
      <div style={{ 
        fontSize: 12, fontWeight: 700, color: '#f59e0b', 
        marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 
      }}>
        🖼️ Ảnh Đại Diện Sản Phẩm
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Preview thumbnail */}
        <div style={{ 
          flexShrink: 0, width: 80, height: 64, borderRadius: 8, 
          border: '1px dashed rgba(245,158,11,0.5)', 
          overflow: 'hidden', background: '#111827', 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          {image ? (
            <Image 
              src={image} 
              alt="preview" 
              width={80} 
              height={64} 
              unoptimized 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <span style={{ fontSize: 24 }}>🖼️</span>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={image}
            placeholder="Dán URL ảnh hoặc upload file bên dưới"
            onChange={e => onImageChange(e.target.value)}
            style={{ ...INPUT_STYLE, fontSize: 12 }}
          />
          <UploadButton 
            isUploading={isUploading} 
            onFileSelect={onFileUpload}
            color="amber"
            label="Chọn File Ảnh"
          />
          <div style={{ fontSize: 10, color: '#6b7280', fontStyle: 'italic' }}>
            Hỗ trợ JPG, PNG, WebP. Ảnh sẽ hiển thị trên card sản phẩm ngoài trang chủ.
          </div>
        </div>
      </div>
    </div>
  );
}

/** Game stats input section */
function GameStatsSection({
  form,
  setForm,
  isUploading,
  onFileUpload,
}: {
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  isUploading: boolean;
  onFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>, 
    targetKey: keyof ProductFormState
  ) => void;
}) {
  return (
    <div style={{ borderTop: '1px solid rgba(99,102,241,0.2)', paddingTop: 14 }}>
      <div style={{ 
        fontSize: 12, fontWeight: 700, color: '#6366f1', 
        marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 
      }}>
        🎮 Thông Số Acc (Hiển Thị Trên Card)
      </div>
      
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {STATS_FIELDS.map(field => (
          <div key={field.key}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5 }}>
              {field.label}
            </label>
            <input 
              type="number" 
              value={form[field.key as keyof ProductFormState] as string} 
              placeholder={field.placeholder}
              onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
              style={{ ...INPUT_STYLE, fontSize: 12 }} 
            />
          </div>
        ))}
      </div>
      
      {/* Rank selector */}
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5 }}>
          Rank (để trống = không hiện)
        </label>
        <select 
          value={form.rank} 
          onChange={e => setForm(prev => ({ ...prev, rank: e.target.value }))} 
          style={{ ...INPUT_STYLE, fontSize: 12 }}
        >
          <option value="">-- Không hiện rank --</option>
          {RANK_OPTIONS.filter(r => r !== '').map(rank => (
            <option key={rank} value={rank}>{rank}</option>
          ))}
        </select>
      </div>
      
      {/* Image galleries */}
      <GallerySection form={form} setForm={setForm} isUploading={isUploading} onFileUpload={onFileUpload} />
      
      <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
        💡 Các nút XEM TƯỚNG / XEM SKIN sẽ tự động ẩn đi nếu KHÔNG có link ảnh nào được nhập.
      </div>
    </div>
  );
}

/** Gallery upload fields (hero, skin, gem images) */
function GallerySection({
  form,
  setForm,
  isUploading,
  onFileUpload,
}: {
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, targetKey: keyof ProductFormState) => void;
}) {
  const galleries = [
    { key: 'heroImages', label: 'Link Ảnh Tướng (Hero Images)', color: 'indigo' },
    { key: 'skinImages', label: 'Link Ảnh Trang Phục (Skin Images)', color: 'pink' },
    { key: 'gemImages', label: 'Link Ảnh Bảng Ngọc (Gem Images)', color: 'emerald' },
  ] as const;

  const colorStyles = {
    indigo: { bg: 'rgba(99,102,241,0.2)', text: '#a78bfa' },
    pink: { bg: 'rgba(236,72,153,0.2)', text: '#f472b6' },
    emerald: { bg: 'rgba(16,185,129,0.2)', text: '#34d399' },
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 8, textTransform: 'uppercase' }}>
        🖼️ Hình Ảnh Chi Tiết (Mỗi link 1 dòng)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {galleries.map(({ key, label, color }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{label}</label>
              <label style={{ 
                cursor: isUploading ? 'not-allowed' : 'pointer', 
                background: colorStyles[color].bg, 
                padding: '3px 8px', 
                borderRadius: 4, 
                color: colorStyles[color].text, 
                fontSize: 10, 
                fontWeight: 700 
              }}>
                {isUploading ? 'Đang up...' : '⬆️ Upload File'}
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={e => onFileUpload(e, key)} 
                  disabled={isUploading} 
                />
              </label>
            </div>
            <textarea 
              rows={2} 
              value={form[key]} 
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} 
              style={{ ...INPUT_STYLE, fontSize: 11, resize: 'vertical' }} 
              placeholder={`https://example.com/${key.replace('Images', '1')}.jpg\nhttps://example.com/${key.replace('Images', '2')}.jpg`} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Reusable upload button */
function UploadButton({
  isUploading,
  onFileSelect,
  color,
  label,
  multiple = false,
}: {
  isUploading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  color: 'amber' | 'indigo' | 'pink' | 'emerald';
  label: string;
  multiple?: boolean;
}) {
  const styles = {
    amber: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b' },
    indigo: { bg: 'rgba(99,102,241,0.2)', border: 'rgba(99,102,241,0.4)', text: '#a78bfa' },
    pink: { bg: 'rgba(236,72,153,0.2)', border: 'rgba(236,72,153,0.4)', text: '#f472b6' },
    emerald: { bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.4)', text: '#34d399' },
  };

  return (
    <label style={{ 
      cursor: isUploading ? 'not-allowed' : 'pointer', 
      display: 'inline-flex', alignItems: 'center', gap: 6, 
      background: styles[color].bg, 
      border: `1px solid ${styles[color].border}`, 
      padding: '6px 12px', 
      borderRadius: 6, 
      color: styles[color].text, 
      fontSize: 11, 
      fontWeight: 700, 
      width: 'fit-content' 
    }}>
      {isUploading ? '⏳ Đang tải...' : `⬆️ ${label}`}
      <input 
        type="file" 
        accept="image/*" 
        multiple={multiple}
        style={{ display: 'none' }} 
        onChange={onFileSelect} 
        disabled={isUploading} 
      />
    </label>
  );
}

/** Main product modal component */
export function ProductModal({
  form,
  setForm,
  editingProduct,
  isUploading,
  onFileUpload,
  onSave,
  onClose,
}: ProductModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      style={{ 
        position: 'fixed', inset: 0, 
        background: 'rgba(0,0,0,0.7)', 
        backdropFilter: 'blur(4px)', 
        zIndex: 2000, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: 20 
      }}
      onClick={handleBackdropClick}
    >
      <div style={{ 
        background: '#1a1f35', 
        border: '1px solid rgba(99,102,241,0.3)', 
        borderRadius: 16, 
        padding: 28, 
        width: '100%', 
        maxWidth: 520, 
        maxHeight: '90vh', 
        overflowY: 'auto' 
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e8eaed', marginBottom: 20 }}>
          {editingProduct ? '✏️ Sửa Sản Phẩm' : '+ Thêm Sản Phẩm Mới'}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Basic fields */}
          {BASIC_FIELDS.map(field => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>
                {field.label}
              </label>
              <input 
                type={field.type} 
                value={form[field.key as keyof ProductFormState] as string} 
                placeholder={field.placeholder}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                style={INPUT_STYLE} 
              />
            </div>
          ))}

          {/* Image upload */}
          <ImageUploadSection
            image={form.image}
            isUploading={isUploading}
            onImageChange={url => setForm(prev => ({ ...prev, image: url }))}
            onFileUpload={e => onFileUpload(e, 'image', true)}
          />

          {/* Game stats */}
          <GameStatsSection
            form={form}
            setForm={setForm}
            isUploading={isUploading}
            onFileUpload={onFileUpload}
          />

          {/* Category selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>
              Danh Mục
            </label>
            <select 
              value={form.categoryId} 
              onChange={e => setForm(prev => ({ ...prev, categoryId: Number(e.target.value) }))} 
              style={INPUT_STYLE}
            >
              {categories.filter(c => c.id > 0).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Hot checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#e8eaed' }}>
            <input 
              type="checkbox" 
              checked={form.isHot} 
              onChange={e => setForm(prev => ({ ...prev, isHot: e.target.checked }))} 
            />
            🔥 Đánh dấu HOT
          </label>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button 
              onClick={onClose} 
              style={{ 
                flex: 1, padding: '10px', 
                background: 'transparent', 
                border: '1px solid rgba(99,102,241,0.3)', 
                borderRadius: 8, 
                color: '#9ca3af', 
                cursor: 'pointer', 
                fontSize: 13, 
                fontFamily: 'inherit' 
              }}
            >
              Huỷ
            </button>
            <button 
              onClick={onSave} 
              style={{ 
                flex: 1, padding: '10px', 
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                border: 'none', 
                borderRadius: 8, 
                color: 'white', 
                cursor: 'pointer', 
                fontSize: 13, 
                fontWeight: 700, 
                fontFamily: 'inherit' 
              }}
            >
              {editingProduct ? '✅ Lưu Thay Đổi' : '+ Thêm Sản Phẩm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
