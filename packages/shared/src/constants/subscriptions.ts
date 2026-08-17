// ─────────────────────────────────────────────
// SalesK — Subscription Plan Constants
// ─────────────────────────────────────────────

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface PlanLimits {
  maxBranches: number;
  maxProducts: number;
  maxUsers: number;
  maxOrdersPerMonth: number;
  maxCustomFieldsPerEntity: number;
  allowedModules: string[];
  dashboardWidgets: 'basic' | 'standard' | 'all' | 'custom';
  offlineMode: boolean;
  kds: boolean;
  apiAccess: boolean;
  exportReports: boolean;
  scheduledReports: boolean;
}

export interface PlanConfig {
  plan: SubscriptionPlan;
  label: string;
  description: string;
  monthlyPrice: number; // KES
  yearlyPrice: number;  // KES
  currency: string;
  limits: PlanLimits;
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    plan: SubscriptionPlan.FREE,
    label: 'Free',
    description: 'Get started with SalesK for free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'KES',
    limits: {
      maxBranches: 1,
      maxProducts: 50,
      maxUsers: 2,
      maxOrdersPerMonth: 500,
      maxCustomFieldsPerEntity: 0,
      allowedModules: ['core_pos'],
      dashboardWidgets: 'basic',
      offlineMode: false,
      kds: false,
      apiAccess: false,
      exportReports: false,
      scheduledReports: false,
    },
  },
  {
    plan: SubscriptionPlan.STARTER,
    label: 'Starter',
    description: 'For growing businesses',
    monthlyPrice: 2500,
    yearlyPrice: 25000,
    currency: 'KES',
    limits: {
      maxBranches: 3,
      maxProducts: 500,
      maxUsers: 5,
      maxOrdersPerMonth: 5000,
      maxCustomFieldsPerEntity: 5,
      allowedModules: ['core_pos', 'inventory', 'crm'],
      dashboardWidgets: 'standard',
      offlineMode: true,
      kds: false,
      apiAccess: false,
      exportReports: true,
      scheduledReports: false,
    },
  },
  {
    plan: SubscriptionPlan.PRO,
    label: 'Pro',
    description: 'For established businesses with multiple branches',
    monthlyPrice: 7500,
    yearlyPrice: 75000,
    currency: 'KES',
    popular: true,
    limits: {
      maxBranches: 10,
      maxProducts: -1, // Unlimited
      maxUsers: 20,
      maxOrdersPerMonth: -1,
      maxCustomFieldsPerEntity: 20,
      allowedModules: ['*'], // All modules
      dashboardWidgets: 'all',
      offlineMode: true,
      kds: true,
      apiAccess: false,
      exportReports: true,
      scheduledReports: true,
    },
  },
  {
    plan: SubscriptionPlan.ENTERPRISE,
    label: 'Enterprise',
    description: 'For large operations with unlimited scale',
    monthlyPrice: 15000,
    yearlyPrice: 150000,
    currency: 'KES',
    limits: {
      maxBranches: -1,
      maxProducts: -1,
      maxUsers: -1,
      maxOrdersPerMonth: -1,
      maxCustomFieldsPerEntity: -1,
      allowedModules: ['*'],
      dashboardWidgets: 'custom',
      offlineMode: true,
      kds: true,
      apiAccess: true,
      exportReports: true,
      scheduledReports: true,
    },
  },
];
