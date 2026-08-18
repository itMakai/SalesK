import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  
  private readonly BASE_URL = 'https://api.paystack.co';

  constructor(private prisma: PrismaService) {}

  /**
   * Initiates a Paystack Charge (Initialize Transaction)
   */
  async initializeTransaction(branchId: string, orderId: string, email: string, amount: number) {
    const config = await this.prisma.extended.paymentConfig.findFirst({
      where: { branchId, provider: 'paystack' },
    });

    // In a real app, you might map config.provider = 'paystack' and get secret key
    // For this boilerplate, assuming we have a secretKey in credentials
    const secretKey = (config?.credentials as any)?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      throw new NotFoundException(`Paystack configuration not found for branch ${branchId}`);
    }

    const payload = {
      email,
      amount: Math.ceil(amount * 100), // Paystack accepts amount in kobo/cents
      reference: `${orderId.slice(0, 8)}-${Date.now()}`, // Unique reference
      metadata: {
        orderId,
        branchId,
      },
    };

    try {
      const response = await fetch(`${this.BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.status === true) {
        // Successfully initiated. Create a pending payment record.
        await this.prisma.extended.payment.create({
          data: {
            orderId,
            branchId,
            method: 'card',
            gateway: 'paystack',
            gatewayRef: payload.reference,
            amount: amount,
            status: 'pending',
            metadata: data.data,
          },
        });

        return {
          success: true,
          authorizationUrl: data.data.authorization_url,
          accessCode: data.data.access_code,
          reference: data.data.reference,
        };
      } else {
        throw new Error(data.message || 'Paystack Initialization Failed');
      }
    } catch (error: any) {
      this.logger.error('Paystack Error', error);
      throw new InternalServerErrorException(error.message || 'Failed to initiate Paystack Transaction');
    }
  }

  /**
   * Handles the asynchronous callback from Paystack (Webhook)
   */
  async handleWebhook(payload: any, signature: string) {
    this.logger.log(`Received Paystack Webhook: ${JSON.stringify(payload)}`);
    
    // In production, verify the signature using crypto and secretKey
    
    if (payload.event !== 'charge.success') {
      return { success: true };
    }

    const reference = payload.data.reference;
    
    if (!reference) return { success: false };

    const payment = await this.prisma.extended.payment.findFirst({
      where: { gatewayRef: reference },
    });

    if (!payment) {
      this.logger.warn(`Payment with reference ${reference} not found.`);
      return { success: false };
    }

    // Update Payment to completed
    await this.prisma.$transaction(async (tx) => {
      await (tx as any).payment.update({
        where: { id: payment.id },
        data: {
          status: 'completed',
          paidAt: new Date(),
          metadata: payload.data,
        },
      });

      // Check if order is fully paid now
      const order = await (tx as any).order.findUnique({
        where: { id: payment.orderId },
        include: { payments: true },
      });

      const totalPaid = order.payments
        .filter((p: any) => p.status === 'completed' || p.id === payment.id)
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      if (totalPaid >= Number(order.total)) {
        await (tx as any).order.update({
          where: { id: order.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });
      }
    });

    return { success: true };
  }
}
