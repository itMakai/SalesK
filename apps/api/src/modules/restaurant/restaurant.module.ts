import { Module, forwardRef } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { KdsGateway } from './kds.gateway';

@Module({
  controllers: [TableController],
  providers: [TableService, KdsGateway],
  exports: [TableService, KdsGateway],
})
export class RestaurantModule {}
