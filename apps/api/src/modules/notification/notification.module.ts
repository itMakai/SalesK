import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SmsChannel } from './channels/sms.channel';
import { SmsService } from './sms.service';

@Module({
  providers: [NotificationService, SmsChannel, SmsService],
  exports: [NotificationService, SmsService],
})
export class NotificationModule {}
