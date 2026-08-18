import { Controller, Get, Put, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('layout')
  getLayout(@Request() req: any) {
    return this.dashboardService.getLayout(req.user);
  }

  @Put('layout')
  saveLayout(@Request() req: any, @Body() body: any) {
    return this.dashboardService.saveLayout(req.user, body.layout, body.widgets);
  }

  @Get('widgets/:type/data')
  getWidgetData(
    @Request() req: any, 
    @Param('type') type: string,
    @Query('timeframe') timeframe?: string
  ) {
    return this.dashboardService.getWidgetData(req.user, type, timeframe);
  }
}
