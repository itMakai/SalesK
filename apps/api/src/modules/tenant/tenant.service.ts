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
}
