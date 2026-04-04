'use client';

/**
 * CategoryTabs - Product category filter tabs
 */

import { categories } from '@/lib/data';

interface CategoryTabsProps {
  activeCategory: number;
  onCategoryChange: (categoryId: number) => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <>
      <div id="menuSanPham" className="section-title">
        Danh Mục Sản Phẩm
      </div>
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>
    </>
  );
}
