import { Controller, Get, Put, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('layout')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  getLayout(@Request() req: any) {
    return this.dashboardService.getLayout(req.user);
  }

  @Put('layout')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  saveLayout(@Request() req: any, @Body() body: any) {
    return this.dashboardService.saveLayout(req.user, body.layout, body.widgets);
  }

  @Get('widgets/:type/data')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  getWidgetData(
    @Request() req: any, 
    @Param('type') type: string,
    @Query('timeframe') timeframe?: string
  ) {
    return this.dashboardService.getWidgetData(req.user, type, timeframe);
  }
}
