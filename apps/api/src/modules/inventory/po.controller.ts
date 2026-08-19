import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PurchaseOrderService } from './po.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderStatusDto } from './dto/po.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  create(@Request() req: any, @Body() dto: CreatePurchaseOrderDto) {
    return this.poService.create(req.user.tenantId, dto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  findAll(@Request() req: any, @Query('branchId') branchId?: string) {
    return this.poService.findAll(req.user.tenantId, branchId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.poService.findOne(req.user.tenantId, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePurchaseOrderStatusDto) {
    return this.poService.updateStatus(req.user.tenantId, id, dto);
  }
}
