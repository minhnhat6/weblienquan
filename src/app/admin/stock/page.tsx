'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth, AccountStockItem } from '@/lib/auth';
import { products } from '@/lib/data';

export default function AdminStock() {
  const { getAccountStock, addAccountStock, deleteAccountStock } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<number>(0);
  const [bulkText, setBulkText] = useState('');
  const [selectedProductForImport, setSelectedProductForImport] = useState<number>(products[0]?.id || 1);

  const stock = getAccountStock(selectedProduct || undefined);
  const available = stock.filter(s => !s.isSold);
  const sold = stock.filter(s => s.isSold);

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    const product = products.find(p => p.id === selectedProductForImport);
    if (!product) return;
    const items: AccountStockItem[] = lines.map((line, idx) => {
      // Use crypto for secure unique ID generation
      const randomBytes = new Uint8Array(4);
      crypto.getRandomValues(randomBytes);
      const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      return {
        id: 'SK-' + Date.now() + '-' + idx + '-' + randomHex,
        productId: product.id,
        productName: product.name,
        accountData: line.trim(),
        isSold: false,
      };
    });
    addAccountStock(items);
    setBulkText('');
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', background: '#111827',
    border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8,
    color: '#e8eaed', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };

  // Summary per product
  const summary = (() => {
    const all = getAccountStock();
    const map: Record<number, { name: string; available: number; sold: number }> = {};
    all.forEach(s => {
      if (!map[s.productId]) map[s.productId] = { name: s.productName, available: 0, sold: 0 };
      if (s.isSold) map[s.productId].sold++; else map[s.productId].available++;
    });
    return Object.entries(map).map(([id, v]) => ({ id: Number(id), ...v }));
  })();

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaed', marginBottom: 24 }}>🗃️ Kho Tài Khoản</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Bulk Import */}
          <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e8eaed', marginBottom: 16 }}>📥 Nhập Kho (Bulk)</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Chọn Sản Phẩm</label>
              <select value={selectedProductForImport} onChange={e => setSelectedProductForImport(Number(e.target.value))} style={{ ...inputStyle, width: '100%' }}>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Danh Sách Tài Khoản (mỗi dòng 1 tài khoản)</label>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={'username:password|server\nusername2:password2|server\n...'}
                rows={8}
                style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
              {bulkText.trim() ? `${bulkText.trim().split('\n').filter(l => l.trim()).length} tài khoản sẽ được nhập` : 'Nhập mỗi tài khoản trên 1 dòng'}
            </div>
            <button onClick={handleBulkImport} disabled={!bulkText.trim()}
              style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: bulkText.trim() ? 1 : 0.5 }}>
              📥 NHẬP VÀO KHO
            </button>
          </div>

          {/* Summary per product */}
          <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e8eaed', marginBottom: 16 }}>📊 Thống Kê Kho</h2>
            {summary.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Kho đang trống. Hãy nhập tài khoản!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {summary.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#111827', borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: '#e8eaed', fontWeight: 500 }}>{s.name}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{s.available} còn</span>
                      <span style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{s.sold} bán</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stock Browser */}
        <div style={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e8eaed' }}>📋 Duyệt Kho</h2>
            <select value={selectedProduct} onChange={e => setSelectedProduct(Number(e.target.value))} style={{ ...inputStyle, minWidth: 260 }}>
              <option value={0}>— Tất cả sản phẩm —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: '6px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              ✅ Còn lại: {available.length}
            </div>
            <div style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
              📦 Đã bán: {sold.length}
            </div>
          </div>

          {stock.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Không có tài khoản nào trong kho này</p>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stock.slice(0, 50).map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0a0e1a', borderRadius: 8, fontSize: 12, border: `1px solid ${s.isSold ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                  <code style={{ color: s.isSold ? '#6b7280' : '#e8eaed', flex: 1, wordBreak: 'break-all' }}>{s.accountData}</code>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: s.isSold ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: s.isSold ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                      {s.isSold ? 'ĐÃ BÁN' : 'CÒN'}
                    </span>
                    {!s.isSold && (
                      <button onClick={() => deleteAccountStock(s.id)} style={{ padding: '3px 8px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 4, color: '#ef4444', fontSize: 10, cursor: 'pointer' }}>🗑️</button>
                    )}
                  </div>
                </div>
              ))}
              {stock.length > 50 && <p style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: 8 }}>...và {stock.length - 50} tài khoản khác</p>}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
