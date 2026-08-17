// ─────────────────────────────────────────────
// SalesK — Business Type Definitions
// ─────────────────────────────────────────────

export enum BusinessType {
  RETAIL = 'retail',
  RESTAURANT = 'restaurant',
  SALON = 'salon',
  CLINIC = 'clinic',
  PHARMACY = 'pharmacy',
  GENERIC = 'generic',
}

export interface BusinessTemplate {
  type: BusinessType;
  label: string;
  description: string;
  icon: string;
  enabledModules: AppModule[];
  defaultCategories: string[];
  defaultDashboardWidgets: string[];
  productUnit: string;
  customFields: CustomFieldDefinition[];
  settings: Record<string, unknown>;
}

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'textarea';
  options?: string[]; // For select type
  required?: boolean;
  defaultValue?: unknown;
  entity: 'product' | 'customer' | 'order';
}

export enum AppModule {
  CORE_POS = 'core_pos',
  INVENTORY = 'inventory',
  TABLE_MANAGEMENT = 'table_management',
  KDS = 'kds',
  APPOINTMENTS = 'appointments',
  LOYALTY = 'loyalty',
  CRM = 'crm',
  ECOMMERCE = 'ecommerce',
  ACCOUNTING = 'accounting',
  HR_PAYROLL = 'hr_payroll',
  ANALYTICS = 'analytics',
  MULTI_CURRENCY = 'multi_currency',
  SUBSCRIPTIONS = 'subscriptions',
}

export const BUSINESS_TEMPLATES: Record<BusinessType, BusinessTemplate> = {
  [BusinessType.RETAIL]: {
    type: BusinessType.RETAIL,
    label: 'Retail Store',
    description: 'General retail, supermarket, electronics, fashion, hardware',
    icon: 'store',
    enabledModules: [
      AppModule.CORE_POS,
      AppModule.INVENTORY,
      AppModule.CRM,
      AppModule.ANALYTICS,
    ],
    defaultCategories: ['Electronics', 'Clothing', 'Groceries', 'Accessories', 'Home & Living'],
    defaultDashboardWidgets: ['sales_today', 'revenue_chart', 'top_products', 'low_stock', 'recent_orders'],
    productUnit: 'piece',
    customFields: [
      { key: 'size', label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], entity: 'product' },
      { key: 'color', label: 'Color', type: 'text', entity: 'product' },
      { key: 'brand', label: 'Brand', type: 'text', entity: 'product' },
    ],
    settings: { enableBarcode: true, enableVariants: true },
  },

  [BusinessType.RESTAURANT]: {
    type: BusinessType.RESTAURANT,
    label: 'Restaurant / Café',
    description: 'Restaurant, café, bar, fast food, food truck',
    icon: 'utensils',
    enabledModules: [
      AppModule.CORE_POS,
      AppModule.TABLE_MANAGEMENT,
      AppModule.KDS,
      AppModule.INVENTORY,
      AppModule.CRM,
      AppModule.ANALYTICS,
    ],
    defaultCategories: ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Sides', 'Specials'],
    defaultDashboardWidgets: ['sales_today', 'active_tables', 'kitchen_queue', 'top_products', 'revenue_chart'],
    productUnit: 'serving',
    customFields: [
      { key: 'preparation_time', label: 'Prep Time (mins)', type: 'number', entity: 'product' },
      { key: 'allergens', label: 'Allergens', type: 'text', entity: 'product' },
      { key: 'dietary', label: 'Dietary Info', type: 'select', options: ['None', 'Vegan', 'Vegetarian', 'Gluten-Free', 'Halal'], entity: 'product' },
    ],
    settings: { enableTables: true, enableModifiers: true, enableKDS: true, enableCourses: true },
  },

  [BusinessType.SALON]: {
    type: BusinessType.SALON,
    label: 'Salon / Spa',
    description: 'Hair salon, beauty spa, barbershop, nail studio',
    icon: 'scissors',
    enabledModules: [
      AppModule.CORE_POS,
      AppModule.APPOINTMENTS,
      AppModule.CRM,
      AppModule.LOYALTY,
      AppModule.ANALYTICS,
    ],
    defaultCategories: ['Haircuts', 'Coloring', 'Treatments', 'Manicure', 'Pedicure', 'Products'],
    defaultDashboardWidgets: ['sales_today', 'upcoming_appointments', 'staff_schedule', 'top_services', 'customer_retention'],
    productUnit: 'service',
    customFields: [
      { key: 'duration_minutes', label: 'Duration (mins)', type: 'number', entity: 'product' },
      { key: 'stylist', label: 'Preferred Stylist', type: 'text', entity: 'customer' },
    ],
    settings: { enableAppointments: true, enableStaffScheduling: true },
  },

  [BusinessType.CLINIC]: {
    type: BusinessType.CLINIC,
    label: 'Clinic / Healthcare',
    description: 'Medical clinic, dental office, optical, veterinary',
    icon: 'heart-pulse',
    enabledModules: [
      AppModule.CORE_POS,
      AppModule.APPOINTMENTS,
      AppModule.CRM,
      AppModule.INVENTORY,
      AppModule.ANALYTICS,
    ],
    defaultCategories: ['Consultation', 'Lab Tests', 'Procedures', 'Medication', 'Supplies'],
    defaultDashboardWidgets: ['sales_today', 'upcoming_appointments', 'patient_visits', 'revenue_chart', 'inventory_alerts'],
    productUnit: 'service',
    customFields: [
      { key: 'duration_minutes', label: 'Duration (mins)', type: 'number', entity: 'product' },
      { key: 'requires_doctor', label: 'Requires Doctor', type: 'boolean', entity: 'product' },
      { key: 'patient_id', label: 'Patient ID', type: 'text', entity: 'customer' },
    ],
    settings: { enableAppointments: true, requirePatientId: true },
  },

  [BusinessType.PHARMACY]: {
    type: BusinessType.PHARMACY,
    label: 'Pharmacy',
    description: 'Pharmacy, chemist, drugstore',
    icon: 'pill',
    enabledModules: [
      AppModule.CORE_POS,
      AppModule.INVENTORY,
      AppModule.CRM,
      AppModule.ANALYTICS,
    ],
    defaultCategories: ['Prescription', 'OTC Medication', 'Supplements', 'Personal Care', 'Medical Devices'],
    defaultDashboardWidgets: ['sales_today', 'low_stock', 'expiring_soon', 'top_products', 'revenue_chart'],
    productUnit: 'piece',
    customFields: [
      { key: 'dosage', label: 'Dosage', type: 'text', entity: 'product' },
      { key: 'requires_prescription', label: 'Requires Prescription', type: 'boolean', entity: 'product' },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date', entity: 'product' },
      { key: 'manufacturer', label: 'Manufacturer', type: 'text', entity: 'product' },
    ],
    settings: { enableBarcode: true, trackExpiry: true, requirePrescription: false },
  },

  [BusinessType.GENERIC]: {
    type: BusinessType.GENERIC,
    label: 'Other Business',
    description: 'Custom business type — configure everything yourself',
    icon: 'briefcase',
    enabledModules: [
      AppModule.CORE_POS,
      AppModule.INVENTORY,
      AppModule.CRM,
      AppModule.ANALYTICS,
    ],
    defaultCategories: ['Category 1', 'Category 2', 'Category 3'],
    defaultDashboardWidgets: ['sales_today', 'revenue_chart', 'top_products', 'recent_orders'],
    productUnit: 'piece',
    customFields: [],
    settings: {},
  },
};
