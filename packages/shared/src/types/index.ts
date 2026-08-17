// ─────────────────────────────────────────────
// SalesK — Shared TypeScript Types
// ─────────────────────────────────────────────

// ─── Tenant ───
export interface ITenant {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  logo?: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  timezone: string;
  settings: Record<string, unknown>;
  dashboardConfig: Record<string, unknown>;
  enabledModules: string[];
  customFields: Record<string, unknown>;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Branch ───
export interface IBranch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  operatingHours: Record<string, { open: string; close: string }>;
  isActive: boolean;
  isHeadquarters: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── User ───
export interface IUser {
  id: string;
  tenantId: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Product ───
export interface IProduct {
  id: string;
  tenantId: string;
  categoryId?: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  image?: string;
  images: string[];
  basePrice: number;
  costPrice?: number;
  taxRate?: number;
  unit: string;
  trackInventory: boolean;
  variants: IProductVariant[];
  modifiers: IProductModifier[];
  customFields: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProductVariant {
  name: string;
  options: string[];
  prices: Record<string, number>;
}

export interface IProductModifier {
  name: string;
  price: number;
  isRequired?: boolean;
  maxSelections?: number;
  options?: Array<{ name: string; price: number }>;
}

// ─── Category ───
export interface ICategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  children?: ICategory[];
}

// ─── Order ───
export interface IOrder {
  id: string;
  tenantId: string;
  branchId: string;
  cashierId: string;
  terminalId?: string;
  orderNumber: string;
  status: string;
  type: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  customerId?: string;
  notes?: string;
  customFields: Record<string, unknown>;
  tableId?: string;
  items: IOrderItem[];
  payments: IPayment[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  modifiers: IProductModifier[];
  notes?: string;
}

// ─── Payment ───
export interface IPayment {
  id: string;
  orderId: string;
  branchId: string;
  method: string;
  gateway?: string;
  gatewayRef?: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, unknown>;
  paidAt?: string;
  createdAt: string;
}

// ─── Customer ───
export interface ICustomer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  customFields: Record<string, unknown>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Inventory ───
export interface IInventoryItem {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  lowStockThreshold?: number;
  updatedAt: string;
}

// ─── Dashboard ───
export interface IDashboardWidget {
  id: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
  // react-grid-layout position
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface IDashboardLayout {
  id: string;
  tenantId: string;
  userId?: string;
  name: string;
  widgets: IDashboardWidget[];
  isDefault: boolean;
}

// ─── Table (Restaurant) ───
export interface ITable {
  id: string;
  branchId: string;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  section?: string;
  posX?: number;
  posY?: number;
}

// ─── Appointment (Salon/Clinic) ───
export interface IAppointment {
  id: string;
  branchId: string;
  customerId?: string;
  staffId?: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
}

// ─── API Response Types ───
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: ApiPaginationMeta;
}

export interface ApiPaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginationQuery {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ─── Auth Types ───
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  activeBranchId?: string;
}

export interface RegisterInput {
  // Owner details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  // Business details
  businessName: string;
  businessType: string;
  // First branch
  branchName: string;
  branchAddress?: string;
  branchCity?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  branchId?: string;
}

export interface PinLoginInput {
  pin: string;
  branchId: string;
}
