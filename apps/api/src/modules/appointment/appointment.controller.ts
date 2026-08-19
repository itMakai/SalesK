import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  create(@Body() createAppointmentDto: any) {
    // Expected to pass branchId in DTO
    return this.appointmentService.create(createAppointmentDto.branchId, createAppointmentDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.VIEWER)
  findAll(
    @Query('branchId') branchId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.appointmentService.findAll(branchId, start, end);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.VIEWER)
  findOne(@Query('branchId') branchId: string, @Param('id') id: string) {
    return this.appointmentService.findOne(branchId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  update(@Query('branchId') branchId: string, @Param('id') id: string, @Body() updateAppointmentDto: any) {
    // The branchId can also be inferred from the appointment itself, 
    // but passing it as query ensures authorization domain
    return this.appointmentService.update(branchId, id, updateAppointmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  remove(@Query('branchId') branchId: string, @Param('id') id: string) {
    return this.appointmentService.remove(branchId, id);
  }
}
