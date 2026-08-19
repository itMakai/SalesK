import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.extended.customer.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.extended.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.extended.customer.findUnique({
      where: { id, tenantId },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { items: true }
        },
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 50,
          include: { service: true }
        }
      }
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(tenantId: string, id: string, data: any) {
    const customer = await this.prisma.extended.customer.findUnique({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.extended.customer.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    const customer = await this.prisma.extended.customer.findUnique({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.extended.customer.delete({
      where: { id },
    });
  }

  async getTopSpenders(tenantId: string, limit: number = 10) {
    return this.prisma.extended.customer.findMany({
      where: { tenantId },
      orderBy: { totalSpent: 'desc' },
      take: limit,
    });
  }
}
