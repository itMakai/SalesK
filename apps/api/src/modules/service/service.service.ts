import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.extended.service.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.extended.service.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const service = await this.prisma.extended.service.findUnique({
      where: { id, tenantId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async update(tenantId: string, id: string, data: any) {
    const service = await this.findOne(tenantId, id);
    return this.prisma.extended.service.update({
      where: { id: service.id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    const service = await this.findOne(tenantId, id);
    return this.prisma.extended.service.delete({
      where: { id: service.id },
    });
  }
}
