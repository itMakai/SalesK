import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    const cashierId = req.user.id;
    // Inject tenantId from the authenticated user
    const dto = { ...createOrderDto, tenantId: req.user.tenantId };
    return this.orderService.create(cashierId, dto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findAll(
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
  ) {
    return this.orderService.findAll(branchId, status);
  }

  @Get('stats/dashboard')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  getDashboardStats(@Request() req: any) {
    return this.orderService.getDashboardStats(req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  cancel(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
  }

  @Patch(':id/void')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  void(@Param('id') id: string) {
    return this.orderService.voidOrder(id);
  }

  @Post(':id/refund')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  refund(
    @Param('id') id: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    return this.orderService.refundOrder(id, body.amount, body.reason);
  }
}
