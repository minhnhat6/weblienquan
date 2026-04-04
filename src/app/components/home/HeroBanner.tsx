'use client';

/**
 * HeroBanner - Main hero section with Ken Burns effect and particles
 */

import { PARTICLE } from './constants';
import { useSiteSettings } from '@/lib/settings';

function generateParticleStyle(index: number) {
  const { BASE_LEFT_OFFSET, BASE_TOP_OFFSET, BASE_DELAY_MOD, BASE_DURATION, DURATION_INCREMENT } = PARTICLE;
  
  return {
    left: `${(index * BASE_LEFT_OFFSET + 5) % 100}%`,
    top: `${(index * BASE_TOP_OFFSET + 10) % 100}%`,
    animationDelay: `${(index * 0.4) % BASE_DELAY_MOD}s`,
    animationDuration: `${BASE_DURATION + (index % 4) * DURATION_INCREMENT}s`,
    width: index % 3 === 0 ? 6 : index % 3 === 1 ? 4 : 3,
    height: index % 3 === 0 ? 6 : index % 3 === 1 ? 4 : 3,
  };
}

export function HeroBanner() {
  const { settings } = useSiteSettings();

  return (
    <div className="hero-banner">
      {/* Ken Burns background - using optimized WebP */}
      <div className="hero-bg-kenburns" style={{ backgroundImage: 'url(/poster.webp)' }} />

      {/* Shimmer light sweep */}
      <div className="hero-shimmer" />

      {/* Particle sparkles */}
      {[...Array(PARTICLE.COUNT)].map((_, i) => (
        <div key={i} className="hero-particle" style={generateParticleStyle(i)} />
      ))}

      {/* Overlay gradient */}
      <div className="hero-overlay" />

      {/* Content */}
      <div className="hero-content">
        <div className="hero-badge">🎮 Liên Quân Mobile</div>
        <h1 className="hero-title">
          MUA ACC LIÊN QUÂN<br />
          <span className="hero-title-highlight">{settings.heroTitle}</span>
        </h1>
        <p className="hero-subtitle">{settings.heroSubtitle}</p>
        <div className="hero-cta-row">
          <a href="#menuSanPham" className="hero-cta-btn hero-cta-primary">🛒 Mua Ngay</a>
          <a href="/client/recharge" className="hero-cta-btn hero-cta-secondary">💰 Nạp Tiền</a>
        </div>
      </div>

      {/* Bottom glow bar */}
      <div className="hero-glow-bar" />
    </div>
  );
}
