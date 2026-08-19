import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  /**
   * Stub for sending SMS messages.
   * In a real application, this would integrate with Twilio, Africa's Talking, or similar.
   */
  async sendSms(phone: string, message: string): Promise<boolean> {
    this.logger.log(`\n=========================================
[SMS SENT]
To: ${phone}
Message: ${message}
=========================================\n`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }

  async sendAppointmentReminder(phone: string, customerName: string, serviceName: string, date: Date): Promise<boolean> {
    const formattedDate = date.toLocaleString();
    const message = `Hi ${customerName}, this is a reminder for your ${serviceName} appointment on ${formattedDate}. Reply YES to confirm or call us to reschedule.`;
    return this.sendSms(phone, message);
  }
}
