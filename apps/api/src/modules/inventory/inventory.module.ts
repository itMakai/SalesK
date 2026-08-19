import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { PurchaseOrderController } from './po.controller';
import { PurchaseOrderService } from './po.service';
import { StockTransferController } from './transfer.controller';
import { StockTransferService } from './transfer.service';

@Module({
  controllers: [InventoryController, SupplierController, PurchaseOrderController, StockTransferController],
  providers: [InventoryService, SupplierService, PurchaseOrderService, StockTransferService],
  exports: [InventoryService]
})
export class InventoryModule {}
