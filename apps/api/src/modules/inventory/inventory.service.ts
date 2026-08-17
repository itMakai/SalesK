import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateInventoryItemDto, RecordMovementDto, BulkRecordMovementDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId?: string, lowStockOnly = false) {
    const where: any = {};
    if (branchId) {
      where.branchId = branchId;
    }

    const items = await this.prisma.extended.inventoryItem.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true, trackInventory: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (lowStockOnly) {
      return items.filter(
        (item) =>
          item.lowStockThreshold !== null &&
          Number(item.quantity) <= Number(item.lowStockThreshold)
      );
    }

    return items;
  }

  async findOne(productId: string, branchId: string) {
    const item = await this.prisma.extended.inventoryItem.findUnique({
      where: {
        productId_branchId: { productId, branchId },
      },
      include: {
        product: true,
        branch: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 20, // last 20 movements
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item not found for Product ${productId} at Branch ${branchId}`);
    }

    return item;
  }

  async updateThreshold(productId: string, branchId: string, dto: UpdateInventoryItemDto) {
    return this.prisma.extended.inventoryItem.upsert({
      where: {
        productId_branchId: { productId, branchId },
      },
      update: {
        lowStockThreshold: dto.lowStockThreshold,
      },
      create: {
        productId,
        branchId,
        quantity: 0,
        lowStockThreshold: dto.lowStockThreshold,
      },
    });
  }

  async recordMovement(productId: string, branchId: string, dto: RecordMovementDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Ensure inventory item exists
      const item = await (tx as any).inventoryItem.upsert({
        where: {
          productId_branchId: { productId, branchId },
        },
        update: {},
        create: {
          productId,
          branchId,
          quantity: 0,
        },
      });

      // 2. Create the movement record
      await (tx as any).inventoryMovement.create({
        data: {
          inventoryItemId: item.id,
          type: dto.type,
          quantity: dto.quantity,
          reference: dto.reference,
          notes: dto.notes,
        },
      });

      // 3. Update the item quantity atomically
      const updatedItem = await (tx as any).inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: {
            increment: dto.quantity,
          },
        },
        include: { product: true, branch: true },
      });

      // Validate stock doesn't go below zero if required by settings, but for now we allow negative for reconciliation
      return updatedItem;
    });
  }

  async bulkRecordMovements(dtos: BulkRecordMovementDto[]) {
    // Used for POS sales, stock-takes
    const results = [];
    for (const dto of dtos) {
      results.push(
        await this.recordMovement(dto.productId, dto.branchId, {
          type: dto.type,
          quantity: dto.quantity,
          reference: dto.reference,
          notes: dto.notes,
        })
      );
    }
    return results;
  }
}
