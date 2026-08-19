import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrderDto, OrderStatus } from './dto/order.dto';
import { KdsGateway } from '../restaurant/kds.gateway';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private kdsGateway: KdsGateway,
  ) {}

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
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
          payments: true,
          table: true,
        },
      });

      // 4. Update customer stats if applicable
      if (dto.customerId && status === OrderStatus.COMPLETED) {
        const pointsEarned = Math.floor(Number(total) / 100);
        const pointsDeducted = dto.redeemedPoints || 0;
        
        await (tx as any).customer.update({
          where: { id: dto.customerId },
          data: {
            visitCount: { increment: 1 },
            totalSpent: { increment: Number(total) },
            loyaltyPoints: { increment: pointsEarned - pointsDeducted },
          },
        });
      }

      // 5. (Optional) In a real app, you would dispatch an event here to deduct inventory
      // We rely on the POS to call the bulk inventory movement endpoint separately, 
      // or we can couple it here.

      // 5. Broadcast to KDS if order type is dine-in or contains kitchen items
      const hasKitchenItems = order.items.some((item: any) => item.product?.category?.isKitchen);
      if (order.type === 'dine_in' || hasKitchenItems) {
        this.kdsGateway.broadcastNewOrder(dto.branchId, order);
      }

      return order;
    });
  }

  async getDashboardStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await this.prisma.extended.order.findMany({
      where: {
        tenantId,
        status: OrderStatus.COMPLETED,
        createdAt: { gte: today },
      },
    });

    const totalRevenueToday = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const salesCountToday = orders.length;

    const activeBranches = await this.prisma.extended.branch.count({
      where: { tenantId },
    });

    return {
      totalRevenueToday,
      salesCountToday,
      activeBranches,
    };
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

  async getActiveKitchenItems(tenantId: string, branchId: string) {
    // Get all pending/completed orders from today that have items with kdsStatus != 'served'
    // and where product.category.isKitchen is true
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await this.prisma.extended.order.findMany({
      where: {
        tenantId,
        branchId,
        createdAt: { gte: today },
        status: { in: [OrderStatus.PENDING, OrderStatus.COMPLETED] }, // Dine-in might be unpaid (pending) or paid (completed)
      },
      include: {
        table: true,
        items: {
          where: {
            kdsStatus: { not: 'served' },
          },
          include: {
            product: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Filter out orders that have no matching items
    return orders
      .map(order => ({
        ...order,
        items: order.items.filter(item => item.product?.category?.isKitchen)
      }))
      .filter(order => order.items.length > 0);
  }
}


