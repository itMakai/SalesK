import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  
  // Safaricom Sandbox URLs. In production, these should be configurable.
  private readonly BASE_URL = 'https://sandbox.safaricom.co.ke';

  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves the Daraja Access Token using Branch credentials
   */
  private async getAccessToken(branchId: string): Promise<string> {
    const config = await this.prisma.extended.paymentConfig.findUnique({
      where: { branchId },
    });

    if (!config || !config.consumerKey || !config.consumerSecret) {
      throw new NotFoundException(`M-Pesa configuration not found for branch ${branchId}`);
    }

    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

    try {
      const response = await fetch(`${this.BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Daraja Auth Failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error: any) {
      this.logger.error('Failed to get M-Pesa Access Token', error);
      throw new InternalServerErrorException('M-Pesa Authentication Failed');
    }
  }

  /**
   * Initiates the STK Push (Lipa Na M-Pesa Online)
   */
  async initiateSTKPush(branchId: string, orderId: string, phone: string, amount: number) {
    const config = await this.prisma.extended.paymentConfig.findUnique({
      where: { branchId },
    });

    if (!config || !config.shortcode || !config.passkey) {
      throw new NotFoundException(`M-Pesa shortcode/passkey not configured for branch ${branchId}`);
    }

    const token = await this.getAccessToken(branchId);
    
    // Format Phone number (Daraja expects 2547XXXXXXXX)
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.slice(1)}`;
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1);
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // or CustomerBuyGoodsOnline for Till
      Amount: Math.ceil(amount), // Daraja only accepts integers
      PartyA: formattedPhone,
      PartyB: config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `https://your-ngrok-url.ngrok.app/api/mpesa/callback`, // Must be a public URL
      AccountReference: orderId.slice(0, 12),
      TransactionDesc: 'POS Payment',
    };

    try {
      const response = await fetch(`${this.BASE_URL}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.ResponseCode === '0') {
        // Successfully initiated. Create a pending payment record.
        await this.prisma.extended.payment.create({
          data: {
            orderId,
            branchId,
            method: 'mpesa',
            gateway: 'daraja',
            gatewayRef: data.CheckoutRequestID,
            amount: amount,
            status: 'pending',
            metadata: data,
          },
        });

        return {
          success: true,
          checkoutRequestId: data.CheckoutRequestID,
          message: data.CustomerMessage,
        };
      } else {
        throw new Error(data.errorMessage || 'STK Push Failed');
      }
    } catch (error: any) {
      this.logger.error('STK Push Error', error);
      throw new InternalServerErrorException(error.message || 'Failed to initiate M-Pesa STK Push');
    }
  }

  /**
   * Handles the asynchronous callback from Safaricom
   */
  async handleCallback(payload: any) {
    this.logger.log(`Received Daraja Callback: ${JSON.stringify(payload)}`);
    
    const body = payload.Body.stkCallback;
    const checkoutRequestId = body.CheckoutRequestID;
    const resultCode = body.ResultCode;
    
    if (!checkoutRequestId) return;

    const payment = await this.prisma.extended.payment.findFirst({
      where: { gatewayRef: checkoutRequestId },
    });

    if (!payment) {
      this.logger.warn(`Payment with CheckoutRequestID ${checkoutRequestId} not found.`);
      return;
    }

    if (resultCode === 0) {
      // Success! Extract M-Pesa receipt number
      const mpesaReceipt = body.CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
      
      // Update Payment to completed
      await this.prisma.$transaction(async (tx) => {
        await (tx as any).payment.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            gatewayRef: mpesaReceipt || payment.gatewayRef,
            paidAt: new Date(),
            metadata: body,
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
    } else {
      // Failed (e.g., cancelled by user, insufficient funds)
      await this.prisma.extended.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          metadata: body,
        },
      });
    }

    return { success: true };
  }
}
