import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateInventoryItemDto, RecordMovementDto, BulkRecordMovementDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findAll(
    @Query('branchId') branchId?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    const lowStockOnly = lowStock === 'true';
    return this.inventoryService.findAll(branchId, lowStockOnly);
  }

  @Get(':productId/:branchId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findOne(
    @Param('productId') productId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.inventoryService.findOne(productId, branchId);
  }

  @Patch(':productId/:branchId/threshold')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  updateThreshold(
    @Param('productId') productId: string,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateThreshold(productId, branchId, dto);
  }

  @Post(':productId/:branchId/movement')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  recordMovement(
    @Param('productId') productId: string,
    @Param('branchId') branchId: string,
    @Body() dto: RecordMovementDto,
  ) {
    return this.inventoryService.recordMovement(productId, branchId, dto);
  }

  @Post('bulk-movement')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  bulkRecordMovements(@Body() dtos: BulkRecordMovementDto[]) {
    // This allows POS clients to record bulk stock deductions during a sale
    return this.inventoryService.bulkRecordMovements(dtos);
  }
}
