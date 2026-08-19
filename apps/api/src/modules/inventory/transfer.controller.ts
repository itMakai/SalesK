import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StockTransferService } from './transfer.service';
import { CreateStockTransferDto, UpdateStockTransferStatusDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock-transfers')
export class StockTransferController {
  constructor(private readonly transferService: StockTransferService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  create(@Request() req: any, @Body() dto: CreateStockTransferDto) {
    return this.transferService.create(req.user.tenantId, dto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findAll(@Request() req: any, @Query('branchId') branchId?: string) {
    return this.transferService.findAll(req.user.tenantId, branchId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.transferService.findOne(req.user.tenantId, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateStockTransferStatusDto) {
    return this.transferService.updateStatus(req.user.tenantId, id, dto);
  }
}
