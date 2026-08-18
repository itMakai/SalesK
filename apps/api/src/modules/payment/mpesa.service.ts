import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);

  constructor(private prisma: PrismaService) {}

  private getSandboxUrl() {
    return 'https://sandbox.safaricom.co.ke';
  }

  /** Retrieve credentials from PaymentConfig.credentials JSON */
  private async getConfig(branchId: string): Promise<{
    consumerKey: string; consumerSecret: string;
    shortcode: string; passkey: string;
    environment: string; baseUrl: string;
  }> {
    const config = await this.prisma.extended.paymentConfig.findFirst({
      where: { branchId, provider: 'mpesa' },
    });

    if (!config) {
      throw new NotFoundException(`M-Pesa configuration not found for branch ${branchId}`);
    }

    const creds = config.credentials as Record<string, string>;
    const env = creds.environment || 'sandbox';
    const baseUrl = env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    return {
      consumerKey: creds.consumerKey || '',
      consumerSecret: creds.consumerSecret || '',
      shortcode: creds.shortcode || '',
      passkey: creds.passkey || '',
      environment: env,
      baseUrl,
    };
  }

  private async getAccessToken(branchId: string) {
    const config = await this.getConfig(branchId);

    if (!config.consumerKey || !config.consumerSecret) {
      throw new NotFoundException(`M-Pesa Consumer Key/Secret not configured for branch ${branchId}`);
    }

    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

    try {
      const response = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${auth}` },
      });

      if (!response.ok) throw new Error(`Daraja Auth Failed: ${response.statusText}`);

      const data = await response.json();
      return { token: data.access_token as string, config };
    } catch (error: any) {
      this.logger.error('Failed to get M-Pesa Access Token', error);
      throw new InternalServerErrorException('M-Pesa Authentication Failed');
    }
  }

  async initiateSTKPush(branchId: string, orderId: string, phone: string, amount: number) {
    const { token, config } = await this.getAccessToken(branchId);

    if (!config.shortcode || !config.passkey) {
      throw new NotFoundException(`M-Pesa shortcode/passkey not configured for branch ${branchId}`);
    }

    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.slice(1)}`;
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1);
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64');

    const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.API_URL}/mpesa/callback`;

    const payload = {
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: orderId.slice(0, 12),
      TransactionDesc: 'POS Payment',
    };

    try {
      const response = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.ResponseCode === '0') {
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
      const mpesaReceipt = body.CallbackMetadata?.Item?.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;

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
            data: { status: 'completed', completedAt: new Date() },
          });
        }
      });
    } else {
      await this.prisma.extended.payment.update({
        where: { id: payment.id },
        data: { status: 'failed', metadata: body },
      });
    }

    return { success: true };
  }
}
