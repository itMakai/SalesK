import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async getTenant(tenantId: string) {
    const tenant = await this.prisma.extended.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.extended.tenant.update({
      where: { id: tenantId },
      data: dto,
    });

    return tenant;
  }

  async getSettings(tenantId: string) {
    const tenant = await this.getTenant(tenantId);
    return tenant.settings;
  }

  async updateSettings(tenantId: string, settings: Record<string, any>) {
    // Merge existing settings with new settings
    const tenant = await this.getTenant(tenantId);
    const updatedSettings = { ...(tenant.settings as object), ...settings };

    return this.prisma.extended.tenant.update({
      where: { id: tenantId },
      data: { settings: updatedSettings },
      select: { settings: true },
    });
  }

  async getThemeConfig(tenantId: string) {
    const tenant = await this.getTenant(tenantId);
    return tenant.dashboardConfig;
  }

  async updateThemeConfig(tenantId: string, dashboardConfig: Record<string, any>) {
    // Merge existing config with new config
    const tenant = await this.getTenant(tenantId);
    const updatedConfig = { ...(tenant.dashboardConfig as object), ...dashboardConfig };

    return this.prisma.extended.tenant.update({
      where: { id: tenantId },
      data: { dashboardConfig: updatedConfig },
      select: { dashboardConfig: true },
    });
  }

  async applyTemplate(tenantId: string, template: string) {
    // 1. Define template configurations
    const templateConfigs: Record<string, any> = {
      retail: {
        modules: ['pos', 'inventory'],
        customFields: {},
        categories: [],
        layout: [
            { i: "w-1", x: 0, y: 0, w: 3, h: 4 },
            { i: "w-2", x: 3, y: 0, w: 3, h: 4 },
            { i: "w-3", x: 0, y: 4, w: 8, h: 10 },
            { i: "w-4", x: 8, y: 4, w: 4, h: 10 },
            { i: "w-5", x: 0, y: 14, w: 6, h: 10 },
            { i: "w-6", x: 6, y: 14, w: 6, h: 10 },
            { i: "w-7", x: 0, y: 24, w: 4, h: 8 },
            { i: "w-8", x: 4, y: 24, w: 4, h: 8 },
            { i: "w-9", x: 8, y: 24, w: 4, h: 8 },
            { i: "w-10", x: 0, y: 32, w: 6, h: 10 },
            { i: "w-11", x: 6, y: 32, w: 6, h: 10 },
          ],
        widgets: [
            { id: "w-1", type: "sales" },
            { id: "w-2", type: "custom-kpis" },
            { id: "w-3", type: "revenue-chart" },
            { id: "w-4", type: "top-products" },
            { id: "w-5", type: "recent-orders" },
            { id: "w-6", type: "payment-breakdown" },
            { id: "w-7", type: "low-stock-alerts" },
            { id: "w-8", type: "branch-comparison" },
            { id: "w-9", type: "staff-performance" },
            { id: "w-10", type: "customer-insights" },
            { id: "w-11", type: "branches" },
          ]
      },
      restaurant: {
        modules: ['pos', 'inventory', 'kitchen_display', 'table_management'],
        customFields: { allergens: 'string', preparation_time: 'number', is_vegan: 'boolean' },
        categories: [
          { name: 'Food', slug: 'food' },
          { name: 'Beverages', slug: 'beverages' },
          { name: 'Desserts', slug: 'desserts' }
        ],
        layout: [
            { i: "w-3", x: 0, y: 0, w: 8, h: 10 },
            { i: "w-4", x: 8, y: 0, w: 4, h: 10 },
            { i: "w-1", x: 0, y: 10, w: 3, h: 4 },
            { i: "w-2", x: 3, y: 10, w: 3, h: 4 },
            { i: "w-7", x: 6, y: 10, w: 6, h: 4 }, // low stock is important
            { i: "w-5", x: 0, y: 14, w: 6, h: 10 },
            { i: "w-6", x: 6, y: 14, w: 6, h: 10 },
            { i: "w-8", x: 0, y: 24, w: 6, h: 8 },
            { i: "w-9", x: 6, y: 24, w: 6, h: 8 },
            { i: "w-10", x: 0, y: 32, w: 6, h: 10 },
            { i: "w-11", x: 6, y: 32, w: 6, h: 10 },
          ],
        widgets: [
            { id: "w-1", type: "sales" },
            { id: "w-2", type: "custom-kpis" },
            { id: "w-3", type: "revenue-chart" },
            { id: "w-4", type: "top-products" },
            { id: "w-5", type: "recent-orders" },
            { id: "w-6", type: "payment-breakdown" },
            { id: "w-7", type: "low-stock-alerts" },
            { id: "w-8", type: "branch-comparison" },
            { id: "w-9", type: "staff-performance" },
            { id: "w-10", type: "customer-insights" },
            { id: "w-11", type: "branches" },
          ]
      },
      salon: {
        modules: ['pos', 'inventory', 'appointments'],
        customFields: { duration_minutes: 'number', requires_patch_test: 'boolean' },
        categories: [
          { name: 'Hair Services', slug: 'hair-services' },
          { name: 'Nails', slug: 'nails' },
          { name: 'Massage', slug: 'massage' },
          { name: 'Retail Products', slug: 'retail-products' }
        ],
        layout: [
            { i: "w-9", x: 0, y: 0, w: 6, h: 8 }, // Staff performance top for salon
            { i: "w-10", x: 6, y: 0, w: 6, h: 8 }, // Customer insights top for salon
            { i: "w-3", x: 0, y: 8, w: 8, h: 10 },
            { i: "w-4", x: 8, y: 8, w: 4, h: 10 },
            { i: "w-1", x: 0, y: 18, w: 3, h: 4 },
            { i: "w-2", x: 3, y: 18, w: 3, h: 4 },
            { i: "w-5", x: 0, y: 22, w: 6, h: 10 },
            { i: "w-6", x: 6, y: 22, w: 6, h: 10 },
            { i: "w-7", x: 0, y: 32, w: 6, h: 8 },
            { i: "w-8", x: 6, y: 32, w: 6, h: 8 },
            { i: "w-11", x: 0, y: 40, w: 12, h: 4 },
          ],
        widgets: [
            { id: "w-1", type: "sales" },
            { id: "w-2", type: "custom-kpis" },
            { id: "w-3", type: "revenue-chart" },
            { id: "w-4", type: "top-products" },
            { id: "w-5", type: "recent-orders" },
            { id: "w-6", type: "payment-breakdown" },
            { id: "w-7", type: "low-stock-alerts" },
            { id: "w-8", type: "branch-comparison" },
            { id: "w-9", type: "staff-performance" },
            { id: "w-10", type: "customer-insights" },
            { id: "w-11", type: "branches" },
          ]
      },
      clinic: {
        modules: ['pos', 'inventory', 'appointments'],
        customFields: { doctor_required: 'boolean', procedure_code: 'string' },
        categories: [
          { name: 'Consultations', slug: 'consultations' },
          { name: 'Procedures', slug: 'procedures' },
          { name: 'Tests', slug: 'tests' }
        ],
        layout: [
            { i: "w-1", x: 0, y: 0, w: 3, h: 4 },
            { i: "w-2", x: 3, y: 0, w: 3, h: 4 },
            { i: "w-3", x: 0, y: 4, w: 8, h: 10 },
            { i: "w-4", x: 8, y: 4, w: 4, h: 10 },
            { i: "w-5", x: 0, y: 14, w: 6, h: 10 },
            { i: "w-6", x: 6, y: 14, w: 6, h: 10 },
            { i: "w-7", x: 0, y: 24, w: 4, h: 8 },
            { i: "w-8", x: 4, y: 24, w: 4, h: 8 },
            { i: "w-9", x: 8, y: 24, w: 4, h: 8 },
            { i: "w-10", x: 0, y: 32, w: 6, h: 10 },
            { i: "w-11", x: 6, y: 32, w: 6, h: 10 },
          ],
        widgets: [
            { id: "w-1", type: "sales" },
            { id: "w-2", type: "custom-kpis" },
            { id: "w-3", type: "revenue-chart" },
            { id: "w-4", type: "top-products" },
            { id: "w-5", type: "recent-orders" },
            { id: "w-6", type: "payment-breakdown" },
            { id: "w-7", type: "low-stock-alerts" },
            { id: "w-8", type: "branch-comparison" },
            { id: "w-9", type: "staff-performance" },
            { id: "w-10", type: "customer-insights" },
            { id: "w-11", type: "branches" },
          ]
      },
      pharmacy: {
        modules: ['pos', 'inventory'],
        customFields: { expiry_date: 'date', batch_number: 'string', prescription_required: 'boolean' },
        categories: [
          { name: 'OTC Medicines', slug: 'otc-medicines' },
          { name: 'Prescription', slug: 'prescription' },
          { name: 'Supplements', slug: 'supplements' }
        ],
        layout: [
            { i: "w-7", x: 0, y: 0, w: 12, h: 6 }, // Low stock is most critical
            { i: "w-1", x: 0, y: 6, w: 3, h: 4 },
            { i: "w-2", x: 3, y: 6, w: 3, h: 4 },
            { i: "w-3", x: 0, y: 10, w: 8, h: 10 },
            { i: "w-4", x: 8, y: 10, w: 4, h: 10 },
            { i: "w-5", x: 0, y: 20, w: 6, h: 10 },
            { i: "w-6", x: 6, y: 20, w: 6, h: 10 },
            { i: "w-8", x: 0, y: 30, w: 4, h: 8 },
            { i: "w-9", x: 4, y: 30, w: 4, h: 8 },
            { i: "w-10", x: 8, y: 30, w: 4, h: 8 },
            { i: "w-11", x: 0, y: 38, w: 12, h: 4 },
          ],
        widgets: [
            { id: "w-1", type: "sales" },
            { id: "w-2", type: "custom-kpis" },
            { id: "w-3", type: "revenue-chart" },
            { id: "w-4", type: "top-products" },
            { id: "w-5", type: "recent-orders" },
            { id: "w-6", type: "payment-breakdown" },
            { id: "w-7", type: "low-stock-alerts" },
            { id: "w-8", type: "branch-comparison" },
            { id: "w-9", type: "staff-performance" },
            { id: "w-10", type: "customer-insights" },
            { id: "w-11", type: "branches" },
          ]
      },
      generic: {
        modules: ['pos', 'inventory'],
        customFields: {},
        categories: [],
        layout: [
            { i: "w-1", x: 0, y: 0, w: 3, h: 4 },
            { i: "w-2", x: 3, y: 0, w: 3, h: 4 },
            { i: "w-3", x: 0, y: 4, w: 8, h: 10 },
            { i: "w-4", x: 8, y: 4, w: 4, h: 10 },
            { i: "w-5", x: 0, y: 14, w: 6, h: 10 },
            { i: "w-6", x: 6, y: 14, w: 6, h: 10 },
            { i: "w-7", x: 0, y: 24, w: 4, h: 8 },
            { i: "w-8", x: 4, y: 24, w: 4, h: 8 },
            { i: "w-9", x: 8, y: 24, w: 4, h: 8 },
            { i: "w-10", x: 0, y: 32, w: 6, h: 10 },
            { i: "w-11", x: 6, y: 32, w: 6, h: 10 },
          ],
        widgets: [
            { id: "w-1", type: "sales" },
            { id: "w-2", type: "custom-kpis" },
            { id: "w-3", type: "revenue-chart" },
            { id: "w-4", type: "top-products" },
            { id: "w-5", type: "recent-orders" },
            { id: "w-6", type: "payment-breakdown" },
            { id: "w-7", type: "low-stock-alerts" },
            { id: "w-8", type: "branch-comparison" },
            { id: "w-9", type: "staff-performance" },
            { id: "w-10", type: "customer-insights" },
            { id: "w-11", type: "branches" },
          ]
      }
    };

    const config = templateConfigs[template] || templateConfigs.generic;

    // 2. Fetch tenant and current categories
    const tenant = await this.getTenant(tenantId);
    
    // 3. Setup categories if requested and empty
    if (config.categories.length > 0) {
      const existingCategoriesCount = await this.prisma.extended.category.count({
        where: { tenantId }
      });
      if (existingCategoriesCount === 0) {
        await this.prisma.extended.category.createMany({
          data: config.categories.map((c: any) => ({
            ...c,
            tenantId
          }))
        });
      }
    }

    // 4. Update tenant settings and modules
    const updatedSettings = {
      ...(tenant.settings as object),
      productCustomFields: config.customFields
    };

    const updatedTenant = await this.prisma.extended.tenant.update({
      where: { id: tenantId },
      data: { 
        businessType: template,
        enabledModules: config.modules,
        settings: updatedSettings
      },
    });

    // 5. Update receipt configs for all branches
    const receiptConfig = { showLogo: true, showTaxBreakdown: true, footer: `Thank you for your business!` };
    await this.prisma.extended.receiptTemplate.updateMany({
      where: { branch: { tenantId } },
      data: { template: receiptConfig }
    });

    // 6. Setup default dashboard layout for the tenant
    const existingLayout = await this.prisma.extended.dashboardLayout.findFirst({
      where: { tenantId, userId: null, isDefault: true }
    });

    if (existingLayout) {
      await this.prisma.extended.dashboardLayout.update({
        where: { id: existingLayout.id },
        data: { layout: config.layout, widgets: config.widgets }
      });
    } else {
      await this.prisma.extended.dashboardLayout.create({
        data: {
          tenantId,
          userId: null,
          isDefault: true,
          name: `${template.charAt(0).toUpperCase() + template.slice(1)} Dashboard`,
          layout: config.layout,
          widgets: config.widgets
        }
      });
    }

    return updatedTenant;
  }
}
