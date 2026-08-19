import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  create(@Request() req: any, @Body() createCustomerDto: any) {
    return this.customerService.create(req.user.tenantId, createCustomerDto);
  }

  @Get('top-spenders')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  getTopSpenders(@Request() req: any, @Query('limit') limit: string) {
    return this.customerService.getTopSpenders(req.user.tenantId, limit ? parseInt(limit, 10) : 10);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.VIEWER)
  findAll(@Request() req: any) {
    return this.customerService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.VIEWER)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.customerService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  update(@Request() req: any, @Param('id') id: string, @Body() updateCustomerDto: any) {
    return this.customerService.update(req.user.tenantId, id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.customerService.remove(req.user.tenantId, id);
  }
}
