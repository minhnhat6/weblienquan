'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SupportSidebar from '@/components/SupportSidebar';
import ToastContainer from '@/components/ToastContainer';
import { useAuth } from '@/lib/auth';
import {
  categories, formatPrice, generateAccountData, Product
} from '@/lib/data';
import {
  HeroBanner,
  MarqueeBar,
  SupportInfoCards,
  CategoryTabs,
  RecentActivityList,
  BlogPreviewSection,
  useLocalProducts,
  QUANTITY,
  ANIMATION,
  SPIN_TICKET_THRESHOLD,
} from './components/home';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface GalleryModalState {
  title: string;
  images: string[];
}

interface ResultModalState {
  product: Product;
  accounts: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function parseUrlCategory(param: string | null): number {
  if (param === null || !/^-?\d+$/.test(param)) return 0;
  const parsed = Number(param);
  return Number.isInteger(parsed) && categories.some(c => c.id === parsed) ? parsed : 0;
}

function filterProductsByPrice(products: Product[], priceParam: string | null): Product[] {
  if (!priceParam) return products;
  const [minStr, maxStr] = priceParam.split('-');
  const min = Number(minStr) || 0;
  const max = maxStr ? Number(maxStr) : Infinity;
  return products.filter(p => p.price >= min && p.price <= max);
}

function filterProductsByRank(products: Product[], rankParam: string | null): Product[] {
  if (!rankParam) return products;
  const rank = rankParam.toLowerCase();
  return products.filter(p =>
    p.name.toLowerCase().includes(rank) ||
    p.description.toLowerCase().includes(rank)
  );
}

// ─── HomeContent ────────────────────────────────────────────────────────────────

function HomeContent() {
  const { user, updateBalance, addOrder, addTransaction, showToast, addSpinTicket } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get('category');
  const priceParam = searchParams.get('price');
  const rankParam = searchParams.get('rank');

  const [manualCategory, setManualCategory] = useState<number | null>(null);
  const [buyModal, setBuyModal] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(QUANTITY.DEFAULT as number);
  const [resultModal, setResultModal] = useState<ResultModalState | null>(null);
  const [buying, setBuying] = useState(false);
  const [galleryModal, setGalleryModal] = useState<GalleryModalState | null>(null);

  const localProducts = useLocalProducts();
  const urlCategory = parseUrlCategory(categoryParam);
  const activeCategory = manualCategory ?? urlCategory;

  let filteredProducts = activeCategory === 0
    ? localProducts
    : localProducts.filter(p => p.categoryId === activeCategory);
  filteredProducts = filterProductsByPrice(filteredProducts, priceParam);
  filteredProducts = filterProductsByRank(filteredProducts, rankParam);

  const handleBuy = (product: Product) => {
    if (!user) {
      showToast('Vui lòng đăng nhập để mua hàng!', 'error');
      router.push('/client/login');
      return;
    }
    setQuantity(QUANTITY.DEFAULT);
    setBuyModal(product);
  };

  const confirmBuy = () => {
    if (!buyModal || !user) return;
    const totalPrice = buyModal.price * quantity;

    if (user.balance < totalPrice) {
      showToast('Số dư không đủ! Vui lòng nạp thêm tiền.', 'error');
      setBuyModal(null);
      return;
    }

    setBuying(true);
    setTimeout(() => {
      const accounts: string[] = [];
      updateBalance(-totalPrice);

      for (let i = 0; i < quantity; i++) {
        const accountData = generateAccountData();
        accounts.push(accountData);
        addOrder({
          id: 'ORD-' + (Date.now() + i),
          userId: user.id,
          productName: buyModal.name + (quantity > 1 ? ` #${i + 1}` : ''),
          productId: buyModal.id,
          accountData,
          amount: buyModal.price,
          date: new Date().toISOString(),
          status: 'success',
        });
      }

      addTransaction({
        id: 'TX-' + Date.now(),
        userId: user.id,
        type: 'purchase',
        amount: -totalPrice,
        description: `Mua: ${buyModal.name}${quantity > 1 ? ` x${quantity}` : ''}`,
        date: new Date().toISOString(),
        status: 'success',
      });

      if (totalPrice >= SPIN_TICKET_THRESHOLD) {
        const extraSpins = Math.floor(totalPrice / SPIN_TICKET_THRESHOLD);
        for (let i = 0; i < extraSpins; i++) addSpinTicket();
        showToast(`🍡 +${extraSpins} lượt quay bonus!`, 'success');
      }

      setResultModal({ product: buyModal, accounts });
      setBuyModal(null);
      setBuying(false);
      showToast(`Mua ${quantity} tài khoản thành công!`, 'success');
    }, ANIMATION.PURCHASE_DELAY_MS);
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <SupportSidebar />

      <HeroBanner />
      <MarqueeBar />

      {/* Main Content */}
      <div className="main-content">
        <SupportInfoCards />
        <CategoryTabs activeCategory={activeCategory} onCategoryChange={setManualCategory} />

        {/* Product Grid */}
        {(priceParam || rankParam) && (
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔍</span>
              Đang lọc theo: {priceParam ? `Giá ${priceParam.replace('-', ' - ')}đ` : ''} {rankParam ? `Rank ${rankParam}` : ''}
              <Link href="/" style={{ marginLeft: 16, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'underline' }}>
                ❌ Xóa bộ lọc
              </Link>
            </h2>
          </div>
        )}
        <div className="product-grid">
          {filteredProducts.map((product, idx) => {
            const catIcon = categories.find(c => c.id === product.categoryId)?.icon || '🎮';
            const hue1 = (product.id * 47) % 360;
            const hue2 = (hue1 + 60) % 360;
            // Use real stats from product data
            const hasStats = product.winRate !== undefined || product.heroes !== undefined;

            return (
              <div
                key={product.id}
                className="product-card lq-card animate-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => handleBuy(product)}
              >
                {/* Image Area */}
                <div className="lq-card-img">
                  {/* Emoji fallback background */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(135deg, hsl(${hue1},70%,22%) 0%, hsl(${hue2},60%,18%) 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 72, userSelect: 'none',
                  }}>
                    {catIcon}
                  </div>
                  {/* Actual product image (overlays the emoji bg) */}
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      loading="lazy"
                      quality={75}
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  {/* Dark overlay to keep badges readable over photo */}
                  {product.image && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
                      pointerEvents: 'none',
                    }} />
                  )}

                  {/* Discount badge - top left */}
                  {product.discount > 0 && (
                    <div className="lq-badge-discount">Giảm {product.discount}%</div>
                  )}

                  {/* HOT badge - top right */}
                  {product.isHot && (
                    <div className="lq-badge-hot">🔥 HOT</div>
                  )}

                  {/* Stats overlay — chỉ hiện nếu admin đã nhập */}
                  {hasStats && (
                    <div className="lq-stats-overlay">
                      {product.winRate !== undefined && (
                        <div className="lq-stat-row"><span>Win: {product.winRate}%</span></div>
                      )}
                      {product.totalGold !== undefined && (
                        <div className="lq-stat-row"><span>Vàng: {product.totalGold}K</span></div>
                      )}
                      {product.totalMatches !== undefined && (
                        <div className="lq-stat-row"><span>Số trận: {product.totalMatches.toLocaleString()}</span></div>
                      )}
                    </div>
                  )}

                  {/* Rank label — chỉ hiện nếu admin đã nhập rank */}
                  {product.rank && (
                    <div className="lq-rank-label">Mác {product.rank}</div>
                  )}
                </div>

                {/* Info Area */}
                <div className="lq-card-info">
                  <div className="lq-card-title">{product.name}</div>

                  {/* Stats — chỉ hiện nếu có heroes/skins/gems */}
                  <div className="lq-card-stats">
                    {product.rank ? (
                      <div>» Rank: <strong style={{ color: '#dc3545' }}>{product.rank}</strong></div>
                    ) : (
                      <div style={{ color: '#aaa', fontStyle: 'italic' }}>{product.description.slice(0, 50)}{product.description.length > 50 ? '...' : ''}</div>
                    )}
                    {(product.heroes || product.skins || product.gems) ? (
                      <div>
                        {product.heroes !== undefined && <>» Tướng: <strong>{product.heroes}</strong>&nbsp;</>}
                        {product.skins !== undefined && <>Skin: <strong>{product.skins}</strong>&nbsp;</>}
                        {product.gems !== undefined && <>Ngọc III: <strong>{product.gems}v</strong></>}
                      </div>
                    ) : null}
                  </div>

                  {/* Price + Button */}
                  <div className="lq-card-bottom">
                    <div className="lq-card-price-block">
                      {product.originalPrice > product.price && (
                        <div className="lq-price-original">{product.originalPrice.toLocaleString('vi-VN')}đ</div>
                      )}
                      <div className="lq-price-current">
                        {product.price === 0 ? 'Miễn phí' : `${product.price.toLocaleString('vi-VN')}đ`}
                      </div>
                    </div>
                    <button className="lq-btn-detail" onClick={e => { e.stopPropagation(); handleBuy(product); }}>
                      {product.price === 0 ? 'NHẬN FREE' : 'XEM CHI TIẾT'}
                    </button>
                  </div>

                  {/* Footer promo */}
                  <div className="lq-card-footer">
                    Mua acc Liên Quân đồng hành trọn đời &nbsp;
                    <span style={{ color: 'var(--purple-main)', fontWeight: 700, cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); handleBuy(product); }}>XEM CHI TIẾT</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <RecentActivityList />
        <BlogPreviewSection />
      </div>

      {/* Buy Confirmation Modal */}
      {buyModal && (
        <div className="modal-overlay" onClick={() => !buying && setBuyModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: 18 }}>
                MÃ SỐ: #LQ-{buyModal.id}
              </div>
              <div style={{ color: '#10b981', fontWeight: 600, fontSize: 13, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 20 }}>
                ● Đang bán
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid currentColor', fontSize: 11, padding: '4px 8px', borderRadius: 4 }}>✓ Trắng thông tin</span>
                <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid currentColor', fontSize: 11, padding: '4px 8px', borderRadius: 4 }}>✓ Đăng ký ảo</span>
                <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid currentColor', fontSize: 11, padding: '4px 8px', borderRadius: 4 }}>✓ Đổi mật khẩu ngay</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>TƯỚNG</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                    {buyModal.heroes ?? 0}
                    {buyModal.heroImages && buyModal.heroImages.length > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--accent-orange)', cursor: 'pointer', marginLeft: 6 }} onClick={() => setGalleryModal({ title: 'Danh Sách Tướng', images: buyModal.heroImages || [] })}>
                        (Xem)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>TRANG PHỤC</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                    {buyModal.skins ?? 0}
                    {buyModal.skinImages && buyModal.skinImages.length > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--accent-orange)', cursor: 'pointer', marginLeft: 6 }} onClick={() => setGalleryModal({ title: 'Trang Phục Hiện Có', images: buyModal.skinImages || [] })}>
                        (Xem)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>BẢNG NGỌC</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                    {buyModal.gems ?? 0} / 90
                    {buyModal.gemImages && buyModal.gemImages.length > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--accent-orange)', cursor: 'pointer', marginLeft: 6 }} onClick={() => setGalleryModal({ title: 'Chi Tiết Bảng Ngọc', images: buyModal.gemImages || [] })}>
                        (Xem)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>RANK HIỆN TẠI</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-green)' }}>{buyModal.rank || buyModal.description.match(/Rank ([a-zA-ZÀ-ỹ ]+)/)?.[0] || 'Random'}</div>
                </div>
              </div>

              {(buyModal.heroImages?.length || buyModal.skinImages?.length || buyModal.gemImages?.length) ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                  {buyModal.heroImages && buyModal.heroImages.length > 0 && (
                    <button className="btn" style={{ background: 'rgba(94, 18, 129, 0.05)', color: 'var(--purple-main)', border: '1px solid rgba(94, 18, 129, 0.3)', fontSize: 12, padding: '8px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(94, 18, 129, 0.1)'; e.currentTarget.style.borderColor = 'var(--purple-main)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(94, 18, 129, 0.05)'; e.currentTarget.style.borderColor = 'rgba(94, 18, 129, 0.3)'; }} onClick={() => setGalleryModal({ title: 'Danh Sách Tướng', images: buyModal.heroImages || [] })}>XEM TƯỚNG</button>
                  )}
                  {buyModal.skinImages && buyModal.skinImages.length > 0 && (
                    <button className="btn" style={{ background: 'rgba(94, 18, 129, 0.05)', color: 'var(--purple-main)', border: '1px solid rgba(94, 18, 129, 0.3)', fontSize: 12, padding: '8px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(94, 18, 129, 0.1)'; e.currentTarget.style.borderColor = 'var(--purple-main)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(94, 18, 129, 0.05)'; e.currentTarget.style.borderColor = 'rgba(94, 18, 129, 0.3)'; }} onClick={() => setGalleryModal({ title: 'Trang Phục Hiện Có', images: buyModal.skinImages || [] })}>XEM TRANG PHỤC</button>
                  )}
                  {buyModal.gemImages && buyModal.gemImages.length > 0 && (
                    <button className="btn" style={{ background: 'rgba(94, 18, 129, 0.05)', color: 'var(--purple-main)', border: '1px solid rgba(94, 18, 129, 0.3)', fontSize: 12, padding: '8px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(94, 18, 129, 0.1)'; e.currentTarget.style.borderColor = 'var(--purple-main)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(94, 18, 129, 0.05)'; e.currentTarget.style.borderColor = 'rgba(94, 18, 129, 0.3)'; }} onClick={() => setGalleryModal({ title: 'Bảng Ngọc Chi Tiết', images: buyModal.gemImages || [] })}>XEM BẢNG NGỌC</button>
                  )}
                </div>
              ) : null}

              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'line-through' }}>{formatPrice(buyModal.originalPrice * quantity)}</div>
                  {buyModal.discount > 0 && (
                    <div style={{ background: 'var(--accent-red)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>-{buyModal.discount}%</div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ color: 'var(--accent-red)', fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{formatPrice(buyModal.price * quantity)}</div>

                  {/* Quantity selector inside price box */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>SL:</span>
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={buying} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}>-</button>
                    <input type="number" min={1} max={20} value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} disabled={buying} style={{ width: 40, textAlign: 'center', padding: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, outline: 'none' }} />
                    <button onClick={() => setQuantity(q => Math.min(20, q + 1))} disabled={buying} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}>+</button>
                  </div>
                </div>

                {buyModal.price * quantity >= 100000 && (
                  <div style={{ marginTop: 12, fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🎁</span> Tặng kèm +{Math.floor(buyModal.price * quantity / 100000)} lượt quay Vòng Quay May Mắn!
                  </div>
                )}
              </div>

              {user && user.balance < buyModal.price * quantity ? (
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => router.push('/client/recharge')}
                  style={{ background: 'var(--gradient-main)', height: 50, fontSize: 16, fontWeight: 800, letterSpacing: 0.5, boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}
                >
                  ⚠️ SỐ DƯ KHÔNG ĐỦ - NẠP THÊM ({formatPrice(buyModal.price * quantity - user.balance)})
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-block"
                  onClick={confirmBuy}
                  disabled={buying || !user}
                  style={{ background: 'var(--gradient-main)', height: 50, fontSize: 16, fontWeight: 800, letterSpacing: 0.5, boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', textTransform: 'uppercase' }}
                >
                  {buying ? '⏳ ĐANG XỬ LÝ GIAO DỊCH...' : 'MUA & NHẬN ACC (AUTO 24/7)'}
                </button>
              )}

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button onClick={() => setBuyModal(null)} disabled={buying} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>Đóng lại</button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="modal-overlay" onClick={() => setResultModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-title" style={{ color: 'var(--accent-green)' }}>
              🎉 Mua Hàng Thành Công!
            </div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{resultModal.product.name}</h3>
              {resultModal.accounts.length > 1 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {resultModal.accounts.length} tài khoản
                </div>
              )}
            </div>

            {/* Account cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {resultModal.accounts.map((acc, idx) => (
                <div key={idx} className="account-reveal" style={{ position: 'relative' }}>
                  {resultModal.accounts.length > 1 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700 }}>
                      TÀI KHOẢN #{idx + 1}
                    </div>
                  )}
                  <h4 style={{ marginBottom: 6 }}>📋 Thông tin tài khoản:</h4>
                  <div className="account-data">{acc}</div>
                  <button className="copy-btn" onClick={() => {
                    navigator.clipboard.writeText(acc);
                    showToast(`Đã sao chép tài khoản ${resultModal.accounts.length > 1 ? `#${idx + 1}` : ''}!`, 'success');
                  }}>
                    📋 Sao chép
                  </button>
                </div>
              ))}
            </div>

            {resultModal.accounts.length > 1 && (
              <button
                className="btn btn-outline btn-block"
                style={{ marginBottom: 10, fontSize: 13 }}
                onClick={() => {
                  const allAccs = resultModal.accounts.map((acc, i) => `--- Tài khoản #${i + 1} ---\n${acc}`).join('\n\n');
                  navigator.clipboard.writeText(allAccs);
                  showToast('Đã sao chép tất cả tài khoản!', 'success');
                }}
              >
                📋 Sao chép tất cả ({resultModal.accounts.length})
              </button>
            )}

            <button className="btn btn-primary btn-block" onClick={() => setResultModal(null)}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {galleryModal && (
        <div className="modal-overlay" onClick={() => setGalleryModal(null)} style={{ zIndex: 3000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: 18 }}>🖼️ {galleryModal.title}</h3>
              <button onClick={() => setGalleryModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {galleryModal.images.map((img, i) => (
                  <Image key={i} src={img} alt={`${galleryModal.title} ${i + 1}`} width={640} height={360} loading="lazy" quality={75} style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid var(--border-color)', objectFit: 'cover', aspectRatio: '16/9' }} />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => setGalleryModal(null)}>Đóng Ảnh</button>
              </div>
            </div>
          </div>
        </div>
      )}


      <Footer />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="loading-spinner" />}>
      <HomeContent />
    </Suspense>
  );
}
