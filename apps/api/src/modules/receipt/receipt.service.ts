import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateReceiptTemplateDto } from './dto/receipt.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

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

  // A helper method that would theoretically generate an HTML receipt string 
  // based on the order and the template
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
    
    // In a real implementation, you would use a template engine like Handlebars or EJS here.
    // For now, we return the raw data and settings so the POS (React Native / Electron) can render it natively.
    return {
      order,
      template,
    };
  }
}
