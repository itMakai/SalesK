import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RecordCashDto } from './dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async recordCashPayment(dto: RecordCashDto) {
    const order = await this.prisma.extended.order.findUnique({
      where: { id: dto.orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    if (order.status === 'completed') {
      throw new BadRequestException('Order is already fully paid');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await (tx as any).payment.create({
        data: {
          orderId: dto.orderId,
          branchId: dto.branchId,
          method: 'cash',
          gateway: 'manual',
          amount: dto.amount,
          status: 'completed',
          metadata: { notes: dto.notes },
          paidAt: new Date(),
        },
      });

      // Calculate total paid including this new payment
      const totalPaid = order.payments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0) + dto.amount;

      // Update order status if fully paid
      if (totalPaid >= Number(order.total)) {
        await (tx as any).order.update({
          where: { id: order.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });
      }

      return payment;
    });
  }

  async getReconciliation(branchId: string, startDate?: string, endDate?: string) {
    const where: any = { branchId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const payments = await this.prisma.extended.payment.findMany({
      where,
      select: {
        method: true,
        status: true,
        amount: true,
        gateway: true,
      }
    });

    // Aggregate by method
    const summary = payments.reduce((acc: any, payment: any) => {
      const method = payment.method;
      if (!acc[method]) {
        acc[method] = { total: 0, completed: 0, pending: 0, failed: 0 };
      }
      
      const amount = Number(payment.amount);
      acc[method].total += amount;
      
      if (payment.status === 'completed') acc[method].completed += amount;
      if (payment.status === 'pending') acc[method].pending += amount;
      if (payment.status === 'failed') acc[method].failed += amount;

      return acc;
    }, {});

    return {
      branchId,
      period: { startDate, endDate },
      summary
    };
  }
}
