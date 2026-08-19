import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStockTransferDto, UpdateStockTransferStatusDto } from './dto/transfer.dto';
import { InventoryService } from './inventory.service';
import { generateOrderNumber } from '@salesk/shared';
import { MovementType } from './dto/inventory.dto';

@Injectable()
export class StockTransferService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async create(tenantId: string, dto: CreateStockTransferDto) {
    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException("Source and destination branches cannot be the same");
    }

    return this.prisma.extended.stockTransfer.create({
      data: {
        tenantId,
        fromBranchId: dto.fromBranchId,
        toBranchId: dto.toBranchId,
        transferNumber: generateOrderNumber('TR', Date.now()),
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
        fromBranch: true,
        toBranch: true,
      },
    });
  }

  async findAll(tenantId: string, branchId?: string) {
    const where: any = { tenantId };
    if (branchId) {
      where.OR = [
        { fromBranchId: branchId },
        { toBranchId: branchId },
      ];
    }

    return this.prisma.extended.stockTransfer.findMany({
      where,
      include: {
        fromBranch: { select: { id: true, name: true } },
        toBranch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const transfer = await this.prisma.extended.stockTransfer.findFirst({
      where: { id, tenantId },
      include: {
        fromBranch: true,
        toBranch: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException(`Stock Transfer with ID ${id} not found`);
    }
    return transfer;
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateStockTransferStatusDto) {
    const transfer = await this.findOne(tenantId, id);

    if (transfer.status === 'received' || transfer.status === 'cancelled') {
      throw new BadRequestException(`Cannot change status of a ${transfer.status} transfer`);
    }

    // Only allow logical progression
    if (dto.status === 'shipped' && transfer.status !== 'pending') {
      throw new BadRequestException("Only pending transfers can be shipped");
    }
    if (dto.status === 'received' && transfer.status !== 'shipped') {
      throw new BadRequestException("Only shipped transfers can be received");
    }

    const updated = await this.prisma.extended.stockTransfer.update({
      where: { id },
      data: { 
        status: dto.status,
        ...(dto.status === 'shipped' ? { shippedAt: new Date() } : {}),
        ...(dto.status === 'received' ? { receivedAt: new Date() } : {}),
      },
    });

    // Handle Inventory Movements
    if (dto.status === 'shipped') {
      // Deduct from source branch
      for (const item of transfer.items) {
        await this.inventoryService.recordMovement(item.productId, transfer.fromBranchId, {
          type: MovementType.TRANSFER_OUT,
          quantity: -Number(item.quantity),
          reference: transfer.transferNumber,
          notes: `Transfer shipped to ${transfer.toBranch.name}`,
        });
      }
    } else if (dto.status === 'received') {
      // Add to destination branch
      for (const item of transfer.items) {
        await this.inventoryService.recordMovement(item.productId, transfer.toBranchId, {
          type: MovementType.TRANSFER_IN,
          quantity: Number(item.quantity),
          reference: transfer.transferNumber,
          notes: `Transfer received from ${transfer.fromBranch.name}`,
        });
      }
    }

    return updated;
  }
}
