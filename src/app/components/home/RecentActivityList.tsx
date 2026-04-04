'use client';

/**
 * RecentActivityList - Shows recent orders
 */

import { recentActivities, formatPrice } from '@/lib/data';

export function RecentActivityList() {
  return (
    <div className="recent-activity">
      <div className="section-title">Đơn Hàng Gần Đây</div>
      <ul className="activity-list">
        {recentActivities.map((activity, index) => (
          <li key={index} className="activity-item">
            <div className="activity-avatar">{activity.user[0]}</div>
            <div className="activity-text">
              <strong>{activity.user}</strong> đã mua{' '}
              <strong>{activity.product}</strong> -{' '}
              <span className="price">{formatPrice(activity.price)}</span>
            </div>
            <span className="activity-time">{activity.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
