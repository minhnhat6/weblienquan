'use client';

/**
 * MarqueeBar - Scrolling recent activity banner
 */

import { recentActivities, formatPrice } from '@/lib/data';

export function MarqueeBar() {
  const duplicatedActivities = [...recentActivities, ...recentActivities];

  return (
    <div className="marquee-bar">
      <div className="marquee-content">
        {duplicatedActivities.map((activity, index) => (
          <div key={index} className="marquee-item">
            🎮 <strong>{activity.user}</strong> đã mua{' '}
            <strong>{activity.product}</strong> -{' '}
            <span className="price">{formatPrice(activity.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
