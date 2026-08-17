import { Module } from '@nestjs/common';
import { MpesaController } from './mpesa.controller';
import { MpesaService } from './mpesa.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaystackService } from './paystack.service';

@Module({
  controllers: [MpesaController, PaymentController],
  providers: [MpesaService, PaymentService, PaystackService]
})
export class PaymentModule {}
