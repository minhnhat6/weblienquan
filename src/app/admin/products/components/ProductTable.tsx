'use client';

import Image from 'next/image';
import { Product, formatPrice, categories } from '@/lib/data';
import { TABLE_HEADERS, BUTTON_STYLES } from './constants';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

/** Single table row component */
function ProductRow({ 
  product, 
  onEdit, 
  onDelete 
}: { 
  product: Product; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const category = categories.find(c => c.id === product.categoryId);
  
  return (
    <tr 
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
        {product.id}
      </td>
      <td style={{ padding: '8px 16px' }}>
        <ProductThumbnail image={product.image} name={product.name} />
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#e8eaed', fontWeight: 600, maxWidth: 250 }}>
        {product.name}
        {product.discount > 0 && (
          <span style={{ 
            marginLeft: 6, fontSize: 10, 
            background: 'rgba(239,68,68,0.2)', 
            color: '#ef4444', 
            padding: '2px 6px', 
            borderRadius: 4 
          }}>
            -{product.discount}%
          </span>
        )}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af' }}>
        {category?.name}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#f59e0b', fontWeight: 700 }}>
        {formatPrice(product.price)}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>
        {product.totalStock}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#06b6d4' }}>
        {product.soldCount.toLocaleString()}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <HotBadge isHot={product.isHot} />
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={BUTTON_STYLES.edit}>✏️ Sửa</button>
          <button onClick={onDelete} style={BUTTON_STYLES.delete}>🗑️ Xóa</button>
        </div>
      </td>
    </tr>
  );
}

function ProductThumbnail({ image, name }: { image?: string; name: string }) {
  if (image) {
    return (
      <Image 
        src={image} 
        alt={name} 
        width={52} 
        height={40} 
        unoptimized 
        style={{ 
          width: 52, height: 40, objectFit: 'cover', 
          borderRadius: 6, border: '1px solid rgba(99,102,241,0.3)', 
          display: 'block' 
        }} 
      />
    );
  }
  
  return (
    <div style={{ 
      width: 52, height: 40, borderRadius: 6, 
      border: '1px dashed rgba(99,102,241,0.3)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      fontSize: 18 
    }}>
      🖼️
    </div>
  );
}

function HotBadge({ isHot }: { isHot: boolean }) {
  if (isHot) {
    return (
      <span style={{ 
        fontSize: 10, 
        background: 'rgba(239,68,68,0.2)', 
        color: '#ef4444', 
        padding: '2px 8px', 
        borderRadius: 10, 
        fontWeight: 700 
      }}>
        🔥 HOT
      </span>
    );
  }
  return <span style={{ fontSize: 10, color: '#6b7280' }}>—</span>;
}

/** Products table with header and rows */
export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <div style={{ 
      background: '#1a1f35', 
      border: '1px solid rgba(99,102,241,0.2)', 
      borderRadius: 12, 
      overflow: 'hidden' 
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#111827' }}>
              {TABLE_HEADERS.map(header => (
                <th 
                  key={header} 
                  style={{ 
                    padding: '12px 16px', textAlign: 'left', 
                    fontSize: 11, fontWeight: 700, 
                    color: '#6b7280', textTransform: 'uppercase', 
                    letterSpacing: 0.5, whiteSpace: 'nowrap' 
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <ProductRow
                key={product.id}
                product={product}
                onEdit={() => onEdit(product)}
                onDelete={() => onDelete(product.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
