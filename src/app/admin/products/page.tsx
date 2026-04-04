'use client';

import { useState, useMemo, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/lib/auth';
import { categories, products as defaultProducts, Product } from '@/lib/data';
import { 
  ProductTable, 
  ProductModal, 
  STORAGE_KEY, 
  INITIAL_FORM_STATE,
  INPUT_STYLE,
  BUTTON_STYLES,
  type ProductFormState 
} from './components';

/** Parse newline-separated URLs into array */
function parseImageUrls(value: string): string[] | undefined {
  const urls = value.split('\n').map(s => s.trim()).filter(Boolean);
  return urls.length > 0 ? urls : undefined;
}

/** Convert optional number field to string for form */
function toFormString(value: number | undefined): string {
  return value !== undefined ? String(value) : '';
}

/** Build stats fields from form state */
function buildStatsFields(form: ProductFormState) {
  return {
    winRate: form.winRate !== '' ? Number(form.winRate) : undefined,
    totalGold: form.totalGold !== '' ? Number(form.totalGold) : undefined,
    totalMatches: form.totalMatches !== '' ? Number(form.totalMatches) : undefined,
    heroes: form.heroes !== '' ? Number(form.heroes) : undefined,
    skins: form.skins !== '' ? Number(form.skins) : undefined,
    gems: form.gems !== '' ? Number(form.gems) : undefined,
    rank: form.rank !== '' ? form.rank : undefined,
    heroImages: parseImageUrls(form.heroImages),
    skinImages: parseImageUrls(form.skinImages),
    gemImages: parseImageUrls(form.gemImages),
  };
}

export default function AdminProducts() {
  const { showToast } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(INITIAL_FORM_STATE);
  
  const [localProducts, setLocalProducts] = useState<Product[]>(() => {
    if (typeof window === 'undefined') return defaultProducts;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultProducts;
  });

  const saveProducts = useCallback((prods: Product[]) => {
    setLocalProducts(prods);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prods));
  }, []);

  const filtered = useMemo(() => localProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCat === 0 || p.categoryId === filterCat;
    return matchSearch && matchCat;
  }), [localProducts, searchTerm, filterCat]);

  const openAddModal = useCallback(() => {
    setEditingProduct(null);
    setForm(INITIAL_FORM_STATE);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      originalPrice: String(product.originalPrice),
      categoryId: product.categoryId,
      totalStock: String(product.totalStock),
      isHot: product.isHot,
      discount: product.discount,
      image: product.image ?? '',
      winRate: toFormString(product.winRate),
      totalGold: toFormString(product.totalGold),
      totalMatches: toFormString(product.totalMatches),
      heroes: toFormString(product.heroes),
      skins: toFormString(product.skins),
      gems: toFormString(product.gems),
      rank: product.rank ?? '',
      heroImages: product.heroImages?.join('\n') ?? '',
      skinImages: product.skinImages?.join('\n') ?? '',
      gemImages: product.gemImages?.join('\n') ?? '',
    });
    setShowModal(true);
  }, []);

  const handleFileUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>, 
    targetKey: keyof ProductFormState, 
    singleFile = false
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const formData = new FormData();
    for (const file of Array.from(e.target.files)) {
      formData.append('file', file);
    }
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.success && data.urls) {
        setForm(prev => {
          if (singleFile) {
            return { ...prev, [targetKey]: data.urls[0] };
          }
          const currentLines = (prev[targetKey] as string).split('\n').map(s => s.trim()).filter(Boolean);
          return { ...prev, [targetKey]: [...currentLines, ...data.urls].join('\n') };
        });
        showToast('Tải ảnh lên thành công!', 'success');
      } else {
        showToast(data.message || 'Lỗi khi tải ảnh', 'error');
      }
    } catch {
      showToast('Không thể kết nối Server', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }, [showToast]);

  const handleSave = useCallback(() => {
    if (!form.name || !form.price) {
      showToast('Vui lòng nhập tên và giá!', 'error');
      return;
    }

    const statsFields = buildStatsFields(form);

    if (editingProduct) {
      const updated = localProducts.map(p => p.id === editingProduct.id ? {
        ...p,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice || form.price),
        categoryId: form.categoryId,
        totalStock: Number(form.totalStock || 0),
        isHot: form.isHot,
        discount: Number(form.discount),
        image: form.image || p.image,
        ...statsFields,
      } : p);
      saveProducts(updated);
      showToast('Đã cập nhật sản phẩm!', 'success');
    } else {
      const newProduct: Product = {
        id: Date.now(),
        name: form.name,
        description: form.description,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice || form.price),
        image: form.image || '',
        categoryId: form.categoryId,
        totalStock: Number(form.totalStock || 0),
        soldCount: 0,
        isHot: form.isHot,
        discount: Number(form.discount),
        ...statsFields,
      };
      saveProducts([...localProducts, newProduct]);
      showToast('Đã thêm sản phẩm mới!', 'success');
    }
    setShowModal(false);
  }, [form, editingProduct, localProducts, saveProducts, showToast]);

  const handleDelete = useCallback((id: number) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    saveProducts(localProducts.filter(p => p.id !== id));
    showToast('Đã xóa sản phẩm!', 'success');
  }, [localProducts, saveProducts, showToast]);

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaed' }}>📦 Quản Lý Sản Phẩm</h1>
          <button onClick={openAddModal} style={BUTTON_STYLES.primary}>+ Thêm Sản Phẩm</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            placeholder="🔍 Tìm sản phẩm..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...INPUT_STYLE, flex: 1, maxWidth: 300 }}
          />
          <select 
            value={filterCat} 
            onChange={e => setFilterCat(Number(e.target.value))} 
            style={{ ...INPUT_STYLE, width: 200 }}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <div style={{ 
            padding: '8px 16px', background: '#1a1f35', 
            borderRadius: 8, fontSize: 13, color: '#6b7280', 
            display: 'flex', alignItems: 'center' 
          }}>
            {filtered.length} sản phẩm
          </div>
        </div>

        {/* Products table */}
        <ProductTable 
          products={filtered}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />

        {/* Product modal */}
        {showModal && (
          <ProductModal
            form={form}
            setForm={setForm}
            editingProduct={editingProduct}
            isUploading={isUploading}
            onFileUpload={handleFileUpload}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
