import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class SmsChannel {
  private readonly logger = new Logger(SmsChannel.name);
  
  // Africa's Talking API Base URL
  // Use https://api.sandbox.africastalking.com/version1/messaging for sandbox
  private readonly BASE_URL = 'https://api.africastalking.com/version1/messaging'; 
  
  // Note: These should ideally come from ConfigService
  private readonly username = process.env.AT_USERNAME || 'sandbox';
  private readonly apiKey = process.env.AT_API_KEY || '';

  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('Africa\'s Talking API key is missing. Skipping SMS.');
      // Simulating success in dev environment if no key is present
      return true;
    }

    // Format phone number to E.164 (+254...) if it starts with 0
    let formattedPhone = to.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `+254${formattedPhone.slice(1)}`;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    try {
      const payload = new URLSearchParams();
      payload.append('username', this.username);
      payload.append('to', formattedPhone);
      payload.append('message', message);
      // Optional: sender ID
      // payload.append('from', 'BIASHARA');

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey,
        },
        body: payload.toString(),
      });

      const data = await response.json();

      if (data.SMSMessageData && data.SMSMessageData.Recipients && data.SMSMessageData.Recipients.length > 0) {
        const recipient = data.SMSMessageData.Recipients[0];
        if (recipient.status === 'Success') {
          return true;
        } else {
          this.logger.error(`SMS Failed to ${formattedPhone}: ${recipient.status}`);
          return false;
        }
      }

      this.logger.error(`SMS Failed: Unexpected response from AT API: ${JSON.stringify(data)}`);
      return false;
    } catch (error: any) {
      this.logger.error('Failed to send SMS via Africa\'s Talking', error);
      throw new InternalServerErrorException('Failed to send SMS');
    }
  }
}
