// ─────────────────────────────────────────────
// SalesK — Payment Method Constants
// ─────────────────────────────────────────────

export enum PaymentMethod {
  CASH = 'cash',
  MPESA = 'mpesa',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT = 'credit', // Customer tab/credit
}

export enum PaymentGateway {
  MANUAL = 'manual',       // Cash, manual bank transfer
  MPESA = 'mpesa',         // Safaricom Daraja API
  PAYSTACK = 'paystack',   // Card payments
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum OrderType {
  SALE = 'sale',
  RETURN = 'return',
  VOID = 'void',
}

export interface PaymentMethodConfig {
  method: PaymentMethod;
  label: string;
  icon: string;
  requiresGateway: boolean;
  gateway?: PaymentGateway;
  supportedCurrencies: string[];
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    method: PaymentMethod.CASH,
    label: 'Cash',
    icon: 'banknote',
    requiresGateway: false,
    supportedCurrencies: ['*'], // All currencies
  },
  {
    method: PaymentMethod.MPESA,
    label: 'M-Pesa',
    icon: 'smartphone',
    requiresGateway: true,
    gateway: PaymentGateway.MPESA,
    supportedCurrencies: ['KES'],
  },
  {
    method: PaymentMethod.CARD,
    label: 'Card (Visa/Mastercard)',
    icon: 'credit-card',
    requiresGateway: true,
    gateway: PaymentGateway.PAYSTACK,
    supportedCurrencies: ['KES', 'USD', 'NGN', 'GHS', 'ZAR'],
  },
  {
    method: PaymentMethod.BANK_TRANSFER,
    label: 'Bank Transfer',
    icon: 'building-2',
    requiresGateway: false,
    supportedCurrencies: ['*'],
  },
  {
    method: PaymentMethod.CREDIT,
    label: 'Customer Credit',
    icon: 'user-check',
    requiresGateway: false,
    supportedCurrencies: ['*'],
  },
];
