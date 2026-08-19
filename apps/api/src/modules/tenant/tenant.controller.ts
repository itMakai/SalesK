import { Controller, Get, Patch, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenantId } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '@salesk/shared';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  getTenant(@CurrentTenantId() tenantId: string) {
    return this.tenantService.getTenant(tenantId);
  }

  @Post('notifications')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async createOperationalNotification(@CurrentTenantId() tenantId: string, @Request() req: any, @Body() body: { type: string; message: string; branchId?: string; branchName?: string; cashierName?: string }) {
    const tenant = await this.tenantService.getTenant(tenantId);
    const settings = tenant.settings as Record<string, any>;
    const notifications = Array.isArray(settings.cashierNotifications) ? settings.cashierNotifications : [];
    const newNotification = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      type: body.type, 
      message: body.message, 
      branchId: body.branchId, 
      branchName: body.branchName, 
      cashierName: body.cashierName, 
      createdBy: req.user.id, 
      createdAt: new Date().toISOString(),
      read: false,
      responses: []
    };
    return this.tenantService.updateSettings(tenantId, { cashierNotifications: [newNotification, ...notifications].slice(0, 100) });
  }

  @Patch('notifications/:id/read')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  async markNotificationRead(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    const tenant = await this.tenantService.getTenant(tenantId);
    const settings = tenant.settings as Record<string, any>;
    const notifications = Array.isArray(settings.cashierNotifications) ? settings.cashierNotifications : [];
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    return this.tenantService.updateSettings(tenantId, { cashierNotifications: updated });
  }

  @Post('notifications/:id/respond')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  async respondToNotification(@CurrentTenantId() tenantId: string, @Param('id') id: string, @Request() req: any, @Body() body: { message: string }) {
    const tenant = await this.tenantService.getTenant(tenantId);
    const settings = tenant.settings as Record<string, any>;
    const notifications = Array.isArray(settings.cashierNotifications) ? settings.cashierNotifications : [];
    const response = {
      message: body.message,
      createdBy: req.user.id,
      authorName: `${req.user.firstName} ${req.user.lastName}`,
      createdAt: new Date().toISOString()
    };
    const updated = notifications.map(n => n.id === id ? { ...n, read: true, responses: [...(n.responses || []), response] } : n);
    return this.tenantService.updateSettings(tenantId, { cashierNotifications: updated });
  }

  @Patch()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  updateTenant(
    @CurrentTenantId() tenantId: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantService.updateTenant(tenantId, updateTenantDto);
  }

  @Get('settings')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  getSettings(@CurrentTenantId() tenantId: string) {
    return this.tenantService.getSettings(tenantId);
  }

  @Patch('settings')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  updateSettings(
    @CurrentTenantId() tenantId: string,
    @Body() settings: Record<string, any>,
  ) {
    return this.tenantService.updateSettings(tenantId, settings);
  }

  @Get('theme')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  getThemeConfig(@CurrentTenantId() tenantId: string) {
    return this.tenantService.getThemeConfig(tenantId);
  }

  @Patch('theme')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  updateThemeConfig(
    @CurrentTenantId() tenantId: string,
    @Body() themeConfig: Record<string, any>,
  ) {
    return this.tenantService.updateThemeConfig(tenantId, themeConfig);
  }

  @Post('apply-template')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  applyTemplate(
    @CurrentTenantId() tenantId: string,
    @Body('template') template: string,
  ) {
    return this.tenantService.applyTemplate(tenantId, template);
  }
}
