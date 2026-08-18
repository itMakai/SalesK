import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
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
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  getTenant(@CurrentTenantId() tenantId: string) {
    return this.tenantService.getTenant(tenantId);
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
