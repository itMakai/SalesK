import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { NotificationGateway } from './notification.gateway';

@Module({
  controllers: [TenantController],
  providers: [TenantService, NotificationGateway]
})
export class TenantModule {}
