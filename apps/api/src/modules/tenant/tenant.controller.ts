import { Controller, Get, Patch, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenantId } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '@salesk/shared';
import { NotificationGateway } from './notification.gateway';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService, private readonly notificationGateway: NotificationGateway) {}

  private visibleNotifications(notifications: any[], user: any, branchId?: string) {
    if (user.role !== UserRole.CASHIER) return branchId ? notifications.filter(n => !n.branchId || n.branchId === branchId) : notifications;
    return notifications.filter(n =>
      n.recipientUserId === user.id ||
      (n.createdBy === user.id && (!branchId || n.branchId === branchId))
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async getTenant(@CurrentTenantId() tenantId: string, @Request() req: any) {
    const tenant = await this.tenantService.getTenant(tenantId);
    if (req.user.role === UserRole.CASHIER) {
      const settings = tenant.settings as Record<string, any>;
      return { ...tenant, settings: { ...settings, cashierNotifications: this.visibleNotifications(settings.cashierNotifications || [], req.user) } };
    }
    return tenant;
  }

  @Get('notifications')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async getNotifications(@CurrentTenantId() tenantId: string, @Request() req: any, @Param() _params: any) {
    const tenant = await this.tenantService.getTenant(tenantId);
    const notifications = Array.isArray((tenant.settings as any).cashierNotifications) ? (tenant.settings as any).cashierNotifications : [];
    return this.visibleNotifications(notifications, req.user, req.query.branchId);
  }

  @Post('notifications')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async createOperationalNotification(@CurrentTenantId() tenantId: string, @Request() req: any, @Body() body: { type: string; message: string; branchId?: string; branchName?: string; cashierName?: string; recipientUserId?: string }) {
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
      recipientUserId: body.recipientUserId,
      createdBy: req.user.id, 
      createdAt: new Date().toISOString(),
      readBy: { [req.user.id]: true },
      responses: []
    };
    const result = await this.tenantService.updateSettings(tenantId, { cashierNotifications: [newNotification, ...notifications].slice(0, 100) });
    this.notificationGateway.publish(tenantId);
    return result;
  }

  @Patch('notifications/:id/read')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async markNotificationRead(@CurrentTenantId() tenantId: string, @Param('id') id: string, @Request() req: any) {
    const tenant = await this.tenantService.getTenant(tenantId);
    const settings = tenant.settings as Record<string, any>;
    const notifications = Array.isArray(settings.cashierNotifications) ? settings.cashierNotifications : [];
    const notification = notifications.find(n => n.id === id);
    if (!notification || !this.visibleNotifications([notification], req.user).length) return { settings };
    const updated = notifications.map(n => n.id === id ? { ...n, readBy: { ...(n.readBy || {}), [req.user.id]: true } } : n);
    const result = await this.tenantService.updateSettings(tenantId, { cashierNotifications: updated });
    this.notificationGateway.publish(tenantId);
    return result;
  }

  @Post('notifications/:id/respond')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async respondToNotification(@CurrentTenantId() tenantId: string, @Param('id') id: string, @Request() req: any, @Body() body: { message: string }) {
    const tenant = await this.tenantService.getTenant(tenantId);
    const settings = tenant.settings as Record<string, any>;
    const notifications = Array.isArray(settings.cashierNotifications) ? settings.cashierNotifications : [];
    const original = notifications.find(n => n.id === id);
    if (!original || !this.visibleNotifications([original], req.user).length) return { settings };
    const response = {
      message: body.message,
      createdBy: req.user.id,
      authorName: `${req.user.firstName} ${req.user.lastName}`,
      createdAt: new Date().toISOString()
    };
    const updated = notifications.map(n => n.id === id ? { ...n, readBy: { ...(n.readBy || {}), [req.user.id]: true, [n.createdBy]: false }, responses: [...(n.responses || []), response] } : n);
    const result = await this.tenantService.updateSettings(tenantId, { cashierNotifications: updated });
    this.notificationGateway.publish(tenantId);
    return result;
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
