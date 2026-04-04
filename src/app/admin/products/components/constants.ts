/**
 * Admin Products Page Constants
 */

export const STORAGE_KEY = 'slq_products_override';

export const TABLE_HEADERS = [
  'ID', 'Ảnh', 'Tên Sản Phẩm', 'Danh Mục', 'Giá', 
  'Tồn Kho', 'Đã Bán', 'HOT', 'Hành Động'
] as const;

export const RANK_OPTIONS = [
  '', // empty = không hiện rank
  'KC 4',
  'KC 5',
  'TA 1',
  'TA 2',
  'Cao Thủ 5*',
  'Đại Cao Thủ',
  'Chiến Tướng',
] as const;

/** Basic form field definitions */
export const BASIC_FIELDS = [
  { label: 'Tên sản phẩm *', key: 'name', type: 'text', placeholder: 'Nhập tên sản phẩm' },
  { label: 'Mô tả', key: 'description', type: 'text', placeholder: 'Nhập mô tả ngắn' },
  { label: 'Giá (VNĐ) *', key: 'price', type: 'number', placeholder: 'VD: 10000' },
  { label: 'Giá gốc (VNĐ)', key: 'originalPrice', type: 'number', placeholder: 'VD: 20000' },
  { label: 'Tồn kho', key: 'totalStock', type: 'number', placeholder: 'Số lượng' },
  { label: 'Giảm giá (%)', key: 'discount', type: 'number', placeholder: '0-100' },
] as const;

/** Game stats field definitions */
export const STATS_FIELDS = [
  { label: 'Tỷ lệ thắng (%)', key: 'winRate', placeholder: 'VD: 52' },
  { label: 'Vàng tích lũy (K)', key: 'totalGold', placeholder: 'VD: 450' },
  { label: 'Số trận', key: 'totalMatches', placeholder: 'VD: 1500' },
  { label: 'Số tướng', key: 'heroes', placeholder: 'VD: 87' },
  { label: 'Số skin', key: 'skins', placeholder: 'VD: 132' },
  { label: 'Ngọc III (v)', key: 'gems', placeholder: 'VD: 90' },
] as const;

/** Reusable input styles */
export const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: '#111827',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: 8,
  color: '#e8eaed',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
};

export const BUTTON_STYLES = {
  primary: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: 8,
    color: 'white',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  } as React.CSSProperties,
  edit: {
    padding: '5px 10px',
    background: 'rgba(99,102,241,0.2)',
    border: 'none',
    borderRadius: 6,
    color: '#6366f1',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 600,
  } as React.CSSProperties,
  delete: {
    padding: '5px 10px',
    background: 'rgba(239,68,68,0.2)',
    border: 'none',
    borderRadius: 6,
    color: '#ef4444',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 600,
  } as React.CSSProperties,
};

/** Product form state type */
export interface ProductFormState {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: number;
  totalStock: string;
  isHot: boolean;
  discount: number;
  image: string;
  winRate: string;
  totalGold: string;
  totalMatches: string;
  heroes: string;
  skins: string;
  gems: string;
  rank: string;
  heroImages: string;
  skinImages: string;
  gemImages: string;
}

export const INITIAL_FORM_STATE: ProductFormState = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  categoryId: 1,
  totalStock: '',
  isHot: false,
  discount: 0,
  image: '',
  winRate: '',
  totalGold: '',
  totalMatches: '',
  heroes: '',
  skins: '',
  gems: '',
  rank: '',
  heroImages: '',
  skinImages: '',
  gemImages: '',
};
