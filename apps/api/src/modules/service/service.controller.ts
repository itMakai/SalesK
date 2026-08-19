import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ServiceService } from './service.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  create(@Request() req: any, @Body() createServiceDto: any) {
    return this.serviceService.create(req.user.tenantId, createServiceDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.VIEWER)
  findAll(@Request() req: any) {
    return this.serviceService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.VIEWER)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.serviceService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  update(@Request() req: any, @Param('id') id: string, @Body() updateServiceDto: any) {
    return this.serviceService.update(req.user.tenantId, id, updateServiceDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.serviceService.remove(req.user.tenantId, id);
  }
}
