import { Injectable } from '@nestjs/common';
import { SmsChannel } from './channels/sms.channel';

@Injectable()
export class NotificationService {
  constructor(private smsChannel: SmsChannel) {}

  /**
   * Send a digital receipt via SMS
   */
  async sendDigitalReceiptSms(to: string, orderNumber: string, amount: number, branchName: string): Promise<boolean> {
    const message = `Thank you for shopping at ${branchName}! Your receipt ${orderNumber} for Ksh ${amount.toLocaleString()} is confirmed.`;
    return this.smsChannel.sendSms(to, message);
  }
}
