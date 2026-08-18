import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrderDto, OrderStatus } from './dto/order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // Generate a human-readable order number (e.g., ORD-20260817-1234)
  private generateOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${date}-${random}`;
  }

  async create(cashierId: string, dto: CreateOrderDto) {
    // 1. Calculate totals dynamically to prevent client-side manipulation
    let subtotal = 0;
    let taxAmount = 0;

    const itemsData = dto.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = item.tax || 0;
      const itemDiscount = item.discount || 0;
      const itemTotal = itemSubtotal + itemTax - itemDiscount;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        ...item,
        total: itemTotal,
        discount: itemDiscount,
        tax: itemTax,
        modifiers: item.modifiers || [],
      };
    });

    const discountAmount = dto.discountAmount || 0;
    const total = subtotal + taxAmount - discountAmount;

    // 2. Validate payments match total if order is marked as completed
    const paymentsTotal = dto.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const isPaidInFull = paymentsTotal >= total;
    const status = isPaidInFull ? OrderStatus.COMPLETED : OrderStatus.PENDING;
    const completedAt = isPaidInFull ? new Date() : null;

    // 3. Create order, items, and payments in a transaction
    return this.prisma.$transaction(async (tx) => {
      const order = await (tx as any).order.create({
        data: {
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          cashierId,
          terminalId: dto.terminalId,
          orderNumber: this.generateOrderNumber(),
          status,
          type: dto.type || 'sale',
          subtotal,
          taxAmount,
          discountAmount,
          total,
          customerId: dto.customerId,
          tableId: dto.tableId,
          notes: dto.notes,
          completedAt,
          items: {
            create: itemsData,
          },
          payments: {
            create: dto.payments?.map(p => ({
              branchId: dto.branchId,
              method: p.method,
              gateway: p.gateway,
              gatewayRef: p.gatewayRef,
              amount: p.amount,
              status: 'completed', // Assuming immediate capture for POS
              metadata: p.metadata || {},
              paidAt: new Date(),
            })) || [],
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      // 4. (Optional) In a real app, you would dispatch an event here to deduct inventory
      // We rely on the POS to call the bulk inventory movement endpoint separately, 
      // or we can couple it here.

      return order;
    });
  }

  async findAll(branchId?: string, status?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    return this.prisma.extended.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cashier: { select: { firstName: true, lastName: true } },
        customer: { select: { name: true } },
        payments: true,
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.extended.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        cashier: { select: { firstName: true, lastName: true } },
        customer: { select: { name: true, phone: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async cancelOrder(id: string) {
    const order = await this.findOne(id);
    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed order. Use void or refund instead.');
    }
    return this.prisma.extended.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async voidOrder(id: string) {
    const order = await this.findOne(id);
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException(`Order is already ${order.status}`);
    }
    return this.prisma.extended.order.update({
      where: { id },
      data: { status: 'voided' },
    });
  }

  async refundOrder(id: string, amount?: number, reason?: string) {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Only completed orders can be refunded');
    }

    const refundAmount = amount ?? Number(order.total);
    if (refundAmount > Number(order.total)) {
      throw new BadRequestException(`Refund amount (${refundAmount}) cannot exceed order total (${order.total})`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Create a refund payment record
      const refundPayment = await (tx as any).payment.create({
        data: {
          orderId: id,
          branchId: (order as any).branchId,
          method: 'refund',
          gateway: 'manual',
          amount: -refundAmount, // Negative to indicate money out
          status: 'completed',
          metadata: { reason: reason || 'Manual refund', originalOrderId: id },
          paidAt: new Date(),
        },
      });

      // If full refund, mark order as refunded
      if (refundAmount >= Number(order.total)) {
        await (tx as any).order.update({
          where: { id },
          data: { status: OrderStatus.REFUNDED },
        });
      }

      return { message: `Refund of Ksh ${refundAmount} processed`, refundPayment };
    });
  }
}

