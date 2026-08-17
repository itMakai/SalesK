// ─────────────────────────────────────────────
// SalesK — Shared Utility Functions
// ─────────────────────────────────────────────

import { CURRENCIES, DEFAULT_CURRENCY } from '../constants/currencies';
import type { CurrencyConfig } from '../constants/currencies';

/**
 * Format a number as currency string.
 * @example formatCurrency(1500, 'KES') → "KSh 1,500.00"
 */
export function formatCurrency(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const config: CurrencyConfig = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
  const fixed = amount.toFixed(config.decimalPlaces);
  const [integer, decimal] = fixed.split('.');

  const formattedInteger = integer.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    config.thousandsSeparator,
  );

  if (config.decimalPlaces === 0) {
    return `${config.symbol} ${formattedInteger}`;
  }

  return `${config.symbol} ${formattedInteger}${config.decimalSeparator}${decimal}`;
}

/**
 * Generate a URL-friendly slug from a string.
 * @example slugify("My Business Name") → "my-business-name"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a branch code from branch name.
 * @example generateBranchCode("Nairobi CBD") → "NRB"
 */
export function generateBranchCode(name: string, index: number = 1): string {
  const words = name.trim().split(/\s+/);
  let code: string;

  if (words.length >= 3) {
    code = words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
  } else if (words.length === 2) {
    code = (words[0].substring(0, 2) + words[1][0]).toUpperCase();
  } else {
    code = words[0].substring(0, 3).toUpperCase();
  }

  return `${code}-${String(index).padStart(2, '0')}`;
}

/**
 * Generate an order number.
 * @example generateOrderNumber("NRB-01", 42) → "NRB-01-00042"
 */
export function generateOrderNumber(branchCode: string, sequence: number): string {
  return `${branchCode}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Calculate tax amount from a subtotal.
 * @example calculateTax(1000, 16) → 160
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * (taxRate / 100) * 100) / 100;
}

/**
 * Calculate inclusive tax (extract tax from a tax-inclusive price).
 * @example calculateInclusiveTax(1160, 16) → 160
 */
export function calculateInclusiveTax(total: number, taxRate: number): number {
  return Math.round((total - total / (1 + taxRate / 100)) * 100) / 100;
}

/**
 * Validate a Kenyan phone number and normalize to 254 format.
 * @example normalizeKenyanPhone("0712345678") → "254712345678"
 */
export function normalizeKenyanPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Already in international format
  if (/^254[17]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // +254 format
  if (/^\+254[17]\d{8}$/.test(cleaned)) {
    return cleaned.substring(1);
  }

  // Local format 07... or 01...
  if (/^0[17]\d{8}$/.test(cleaned)) {
    return '254' + cleaned.substring(1);
  }

  return null; // Invalid
}

/**
 * Mask a phone number for display.
 * @example maskPhone("254712345678") → "0712***678"
 */
export function maskPhone(phone: string): string {
  const normalized = normalizeKenyanPhone(phone);
  if (!normalized) return phone;

  const local = '0' + normalized.substring(3);
  return local.substring(0, 4) + '***' + local.substring(7);
}

/**
 * Check if a value represents unlimited (-1).
 */
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

/**
 * Safely parse JSON with a fallback.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Deep clone an object.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
