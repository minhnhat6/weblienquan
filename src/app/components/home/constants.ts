/**
 * Home page constants - magic values and configuration
 */

export const PRODUCTS_OVERRIDE_KEY = 'slq_products_override';

export const SPIN_TICKET_THRESHOLD = 100000;

export const QUANTITY = {
  MIN: 1,
  MAX: 20,
  DEFAULT: 1,
} as const;

export const ANIMATION = {
  PURCHASE_DELAY_MS: 1500,
  CARD_STAGGER_DELAY_S: 0.05,
} as const;

export const PARTICLE = {
  COUNT: 18,
  BASE_LEFT_OFFSET: 37,
  BASE_TOP_OFFSET: 53,
  BASE_DELAY_MOD: 3,
  BASE_DURATION: 2.5,
  DURATION_INCREMENT: 0.6,
} as const;

export const BADGE_STYLES = {
  inStock: {
    background: 'rgba(16,185,129,0.1)',
    color: '#10b981',
    border: '1px solid currentColor',
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 4,
  },
} as const;
