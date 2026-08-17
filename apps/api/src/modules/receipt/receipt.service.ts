import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateReceiptTemplateDto } from './dto/receipt.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReceiptService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  async getTemplate(branchId: string) {
    let template = await this.prisma.extended.receiptTemplate.findUnique({
      where: { branchId },
    });

    if (!template) {
      // Auto-create default template for branch if it doesn't exist
      template = await this.prisma.extended.receiptTemplate.create({
        data: { branchId },
      });
    }

    return template;
  }

  async updateTemplate(branchId: string, dto: UpdateReceiptTemplateDto) {
    return this.prisma.extended.receiptTemplate.upsert({
      where: { branchId },
      update: dto,
      create: {
        branchId,
        ...dto,
      },
    });
  }

  async generateHtmlReceipt(orderId: string, branchId: string) {
    const order = await this.prisma.extended.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        branch: { include: { tenant: true } },
        cashier: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const template = await this.getTemplate(branchId);
    
    return {
      order,
      template,
    };
  }

  async sendDigitalReceipt(orderId: string, branchId: string, phone: string) {
    const data = await this.generateHtmlReceipt(orderId, branchId);
    const branchName = data.order.branch.name || 'Our Store';
    const amount = Number(data.order.total);
    const orderNumber = data.order.orderNumber;

    const success = await this.notificationService.sendDigitalReceiptSms(phone, orderNumber, amount, branchName);
    
    if (!success) {
      throw new BadRequestException('Failed to send digital receipt');
    }
    return { success: true };
  }

  async generateEscPosReceipt(orderId: string, branchId: string) {
    const data = await this.generateHtmlReceipt(orderId, branchId);
    const order = data.order;
    const template = data.template;

    // A basic textual representation that could be sent to an ESC/POS printer or raw print endpoint
    const escposLines = [
      (template.header || order.branch.name).toUpperCase().padStart(24, ' '),
      '--------------------------------',
      `Order: ${order.orderNumber}`,
      `Date: ${order.createdAt.toISOString()}`,
      `Cashier: ${order.cashier.firstName}`,
      '--------------------------------',
    ];

    order.items.forEach((item: any) => {
      const line = `${item.quantity}x ${item.productName.substring(0, 15).padEnd(15, ' ')} ${Number(item.total).toFixed(2)}`;
      escposLines.push(line);
    });

    escposLines.push('--------------------------------');
    escposLines.push(`Subtotal: ${Number(order.subtotal).toFixed(2)}`);
    escposLines.push(`Tax: ${Number(order.taxAmount).toFixed(2)}`);
    escposLines.push(`Total: ${Number(order.total).toFixed(2)}`);
    escposLines.push('--------------------------------');
    escposLines.push(template.footer || 'Thank you for your business!');
    escposLines.push('\n\n\n'); // Feed lines

    return escposLines.join('\n');
  }
}
