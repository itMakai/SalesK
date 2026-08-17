// ─────────────────────────────────────────────
// SalesK — Permission & Role Constants
// ─────────────────────────────────────────────

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  KITCHEN = 'kitchen',
  VIEWER = 'viewer',
}

export enum Permission {
  // Tenant
  TENANT_UPDATE = 'tenant:update',
  TENANT_DELETE = 'tenant:delete',
  TENANT_BILLING = 'tenant:billing',

  // Branches
  BRANCH_CREATE = 'branch:create',
  BRANCH_UPDATE = 'branch:update',
  BRANCH_DELETE = 'branch:delete',
  BRANCH_VIEW = 'branch:view',

  // Users
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_VIEW = 'user:view',

  // Products
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  PRODUCT_VIEW = 'product:view',
  PRODUCT_IMPORT = 'product:import',

  // Orders
  ORDER_CREATE = 'order:create',
  ORDER_VIEW = 'order:view',
  ORDER_UPDATE = 'order:update',
  ORDER_REFUND = 'order:refund',
  ORDER_VOID = 'order:void',

  // Payments
  PAYMENT_PROCESS = 'payment:process',
  PAYMENT_VIEW = 'payment:view',
  PAYMENT_REFUND = 'payment:refund',
  PAYMENT_CONFIG = 'payment:config',

  // Inventory
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_ADJUST = 'inventory:adjust',
  INVENTORY_TRANSFER = 'inventory:transfer',

  // Customers
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',
  CUSTOMER_VIEW = 'customer:view',

  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',

  // Dashboard
  DASHBOARD_CUSTOMIZE = 'dashboard:customize',

  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',

  // Tables (Restaurant)
  TABLE_MANAGE = 'table:manage',

  // Appointments (Salon/Clinic)
  APPOINTMENT_MANAGE = 'appointment:manage',

  // KDS
  KDS_VIEW = 'kds:view',
  KDS_UPDATE = 'kds:update',
}

/**
 * Default permissions per role.
 * Owners get everything. Permissions cascade down.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: Object.values(Permission), // All permissions

  [UserRole.ADMIN]: Object.values(Permission).filter(
    (p) => p !== Permission.TENANT_DELETE && p !== Permission.TENANT_BILLING
  ),

  [UserRole.MANAGER]: [
    Permission.BRANCH_VIEW,
    Permission.BRANCH_UPDATE,
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_IMPORT,
    Permission.ORDER_CREATE,
    Permission.ORDER_VIEW,
    Permission.ORDER_UPDATE,
    Permission.ORDER_REFUND,
    Permission.ORDER_VOID,
    Permission.PAYMENT_PROCESS,
    Permission.PAYMENT_VIEW,
    Permission.PAYMENT_REFUND,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_ADJUST,
    Permission.INVENTORY_TRANSFER,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.DASHBOARD_CUSTOMIZE,
    Permission.SETTINGS_VIEW,
    Permission.TABLE_MANAGE,
    Permission.APPOINTMENT_MANAGE,
    Permission.KDS_VIEW,
    Permission.KDS_UPDATE,
  ],

  [UserRole.CASHIER]: [
    Permission.PRODUCT_VIEW,
    Permission.ORDER_CREATE,
    Permission.ORDER_VIEW,
    Permission.PAYMENT_PROCESS,
    Permission.PAYMENT_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.TABLE_MANAGE,
    Permission.KDS_VIEW,
  ],

  [UserRole.KITCHEN]: [
    Permission.ORDER_VIEW,
    Permission.KDS_VIEW,
    Permission.KDS_UPDATE,
  ],

  [UserRole.VIEWER]: [
    Permission.BRANCH_VIEW,
    Permission.PRODUCT_VIEW,
    Permission.ORDER_VIEW,
    Permission.PAYMENT_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.CUSTOMER_VIEW,
    Permission.REPORT_VIEW,
  ],
};
