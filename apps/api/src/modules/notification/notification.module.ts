import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SmsChannel } from './channels/sms.channel';

@Module({
  providers: [NotificationService, SmsChannel],
  exports: [NotificationService],
})
export class NotificationModule {}
