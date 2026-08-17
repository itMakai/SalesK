import { Controller, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { MpesaService } from './mpesa.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@Controller('mpesa')
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  @Post('stk-push')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async initiateSTKPush(@Body() body: { branchId: string; orderId: string; phone: string; amount: number }) {
    return this.mpesaService.initiateSTKPush(body.branchId, body.orderId, body.phone, body.amount);
  }

  // The callback endpoint MUST NOT use authentication guards since Safaricom calls it directly.
  @Post('callback')
  async handleCallback(@Body() body: any) {
    // Acknowledge receipt immediately to Daraja, while processing happens in the background.
    // Daraja expects a generic success JSON response otherwise it will retry.
    
    // Fire and forget processing (in a real app, use a queue like BullMQ)
    this.mpesaService.handleCallback(body).catch((err) => {
      console.error('Failed to process Daraja callback', err);
    });

    return {
      ResultCode: 0,
      ResultDesc: "Accepted"
    };
  }
}
