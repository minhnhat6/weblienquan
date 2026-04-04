/**
 * Spin page constants
 */

export const WHEEL = {
  SIZE: 420,
  OUTER_PADDING: 4,
  RING_WIDTH: 22,
  CENTER_RADIUS: 52,
  INNER_CENTER_RADIUS: 38,
  BALL_RADIUS: 6,
} as const;

export const ANIMATION = {
  SPIN_DURATION_MS: 4500,
  RESULT_DELAY_MS: 4600,
  FULL_ROTATIONS: 6,
} as const;

export const SPIN_TICKET_THRESHOLD = 100000;
export const MAX_HISTORY_ITEMS = 10;

export const RULES = [
  'Mua đơn hàng ≥ 100.000đ → tặng 1 lượt quay',
  'Lượt quay được cộng ngay sau khi mua',
  'Vòng quay hoàn toàn miễn phí',
  'Tiền thưởng cộng ngay vào ví',
  'Không giới hạn số lượt tích lũy',
] as const;

export const COLORS = {
  gold: {
    light: '#ffd700',
    dark: '#b8860b',
    highlight: '#ffec6e',
    border: '#c8960c',
  },
  center: {
    light: '#fffacd',
    mid: '#ff8c00',
    dark: '#8b4513',
    border: '#7a4500',
  },
} as const;
