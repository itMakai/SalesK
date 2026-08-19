import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderStatusDto } from './dto/po.dto';
import { InventoryService } from './inventory.service';
import { generateOrderNumber } from '@salesk/shared';
import { MovementType } from './dto/inventory.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async create(tenantId: string, dto: CreatePurchaseOrderDto) {
    const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    return this.prisma.extended.purchaseOrder.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        supplierId: dto.supplierId,
        orderNumber: generateOrderNumber('PO', Date.now()),
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        notes: dto.notes,
        totalAmount,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.quantity * item.unitCost,
          })),
        },
      },
      include: {
        items: true,
        supplier: true,
        branch: true,
      },
    });
  }

  async findAll(tenantId: string, branchId?: string) {
    const where: any = { tenantId };
    if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.extended.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const po = await this.prisma.extended.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        branch: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }
    return po;
  }

  async updateStatus(tenantId: string, id: string, dto: UpdatePurchaseOrderStatusDto) {
    const po = await this.findOne(tenantId, id);

    if (po.status === 'received' || po.status === 'cancelled') {
      throw new BadRequestException(`Cannot change status of a ${po.status} purchase order`);
    }

    const updatedPo = await this.prisma.extended.purchaseOrder.update({
      where: { id },
      data: { status: dto.status },
    });

    // If marked as received, update inventory automatically
    if (dto.status === 'received') {
      for (const item of po.items) {
        await this.inventoryService.recordMovement(item.productId, po.branchId, {
          type: MovementType.PURCHASE,
          quantity: Number(item.quantity),
          reference: po.orderNumber,
          notes: `Received from PO ${po.orderNumber}`,
        });
      }
    }

    return updatedPo;
  }
}
