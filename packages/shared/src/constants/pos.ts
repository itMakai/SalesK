// ─────────────────────────────────────────────
// SalesK — POS Terminal Constants
// ─────────────────────────────────────────────

export interface PosShortcut {
  key: string;
  label: string;
  description: string;
  roles?: string[];
}

export interface PosPromotionPreset {
  code: string;
  label: string;
  description: string;
  type: 'fixed' | 'percentage' | 'bundle' | 'loyalty';
  value: number;
}

export interface PosPaymentRoute {
  method: 'cash' | 'mpesa' | 'card' | 'credit';
  label: string;
  tone: string;
}

export const POS_SHORTCUTS: PosShortcut[] = [
  {
    key: 'F2',
    label: 'Focus search',
    description: 'Jump directly to product search',
  },
  {
    key: 'F4',
    label: 'Suspend ticket',
    description: 'Hold the current sale for later recall',
  },
  {
    key: 'F6',
    label: 'Cash checkout',
    description: 'Complete the order with cash',
    roles: ['owner', 'admin', 'manager', 'cashier'],
  },
  {
    key: 'F8',
    label: 'Ticket manager',
    description: 'Open suspended and recent tickets',
  },
];

export const POS_PROMOTIONS: PosPromotionPreset[] = [
  {
    code: 'SAVE10',
    label: '10% Saver',
    description: 'Apply 10% off the current ticket',
    type: 'percentage',
    value: 10,
  },
  {
    code: 'LUNCH25',
    label: 'Lunch Deal',
    description: 'Ksh 25 discount for quick deals',
    type: 'fixed',
    value: 25,
  },
  {
    code: 'BOGO',
    label: 'BOGO Assist',
    description: 'Discount the cheapest qualifying item',
    type: 'bundle',
    value: 1,
  },
  {
    code: 'LOYAL5',
    label: 'Loyalty Boost',
    description: 'Redeem a small loyalty-friendly reduction',
    type: 'loyalty',
    value: 5,
  },
];

export const POS_PAYMENT_ROUTES: PosPaymentRoute[] = [
  { method: 'cash', label: 'Cash', tone: 'emerald' },
  { method: 'mpesa', label: 'M-Pesa', tone: 'green' },
  { method: 'card', label: 'Card', tone: 'sky' },
  { method: 'credit', label: 'Credit', tone: 'amber' },
];