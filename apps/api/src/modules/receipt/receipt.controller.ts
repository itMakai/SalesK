import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { UpdateReceiptTemplateDto } from './dto/receipt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get('template/:branchId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  getTemplate(@Param('branchId') branchId: string) {
    return this.receiptService.getTemplate(branchId);
  }

  @Patch('template/:branchId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  updateTemplate(
    @Param('branchId') branchId: string,
    @Body() dto: UpdateReceiptTemplateDto,
  ) {
    return this.receiptService.updateTemplate(branchId, dto);
  }

  @Get('generate/:branchId/:orderId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  generateReceipt(
    @Param('branchId') branchId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.receiptService.generateHtmlReceipt(orderId, branchId);
  }

  @Post(':orderId/send')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  sendDigitalReceipt(
    @Param('orderId') orderId: string,
    @Body() body: { branchId: string; phone: string }
  ) {
    return this.receiptService.sendDigitalReceipt(orderId, body.branchId, body.phone);
  }

  @Get(':orderId/escpos/:branchId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  getEscPosReceipt(
    @Param('orderId') orderId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.receiptService.generateEscPosReceipt(orderId, branchId);
  }
}
