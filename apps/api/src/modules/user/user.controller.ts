import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  findAll(@Request() req: any) {
    return this.userService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.userService.findOne(id, req.user.tenantId);
  }

  @Post('invite')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  invite(@Request() req: any, @Body() dto: any) {
    return this.userService.invite(req.user.tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  update(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.userService.update(id, req.user.tenantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string, @Request() req: any) {
    return this.userService.deactivate(id, req.user.tenantId);
  }

  @Patch(':id/reset-pin')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  resetPin(@Param('id') id: string, @Request() req: any, @Body('pin') pin: string) {
    return this.userService.resetPin(id, req.user.tenantId, pin);
  }
}
