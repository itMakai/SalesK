import { Controller, Post, Get, Body, Param, Query, Headers, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaystackService } from './paystack.service';
import { RecordCashDto, PaystackChargeDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paystackService: PaystackService
  ) {}

  @Post('cash')
  async recordCash(@Body() dto: RecordCashDto) {
    return this.paymentService.recordCashPayment(dto);
  }

  @Post('paystack/charge')
  async initiatePaystack(@Body() dto: PaystackChargeDto) {
    return this.paystackService.initializeTransaction(
      dto.branchId,
      dto.orderId,
      dto.email,
      dto.amount
    );
  }

  @Post('paystack/webhook')
  async paystackWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }
    return this.paystackService.handleWebhook(payload, signature);
  }

  @Get('reconcile')
  async reconcile(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    if (!branchId) {
      throw new BadRequestException('branchId is required');
    }
    return this.paymentService.getReconciliation(branchId, startDate, endDate);
  }
}
