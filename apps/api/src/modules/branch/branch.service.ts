import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    return this.prisma.extended.branch.create({
      data: createBranchDto as any,
    });
  }

  async findAll() {
    return this.prisma.extended.branch.findMany({
      orderBy: { createdAt: 'desc' },
      include: { taxConfig: true },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.extended.branch.findUnique({
      where: { id },
      include: { taxConfig: true },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    // Validate existence
    await this.findOne(id);

    return this.prisma.extended.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  async remove(id: string) {
    // Validate existence
    await this.findOne(id);

    return this.prisma.extended.branch.delete({
      where: { id },
    });
  }

  async updatePaymentConfig(branchId: string, config: any) {
    return this.prisma.extended.paymentConfig.upsert({
      where: { branchId },
      update: {
        provider: config.provider || 'mpesa',
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
        shortcode: config.shortcode,
        passkey: config.passkey,
        isEnabled: config.isEnabled ?? true,
        environment: config.environment || 'sandbox',
      },
      create: {
        branchId,
        provider: config.provider || 'mpesa',
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
        shortcode: config.shortcode,
        passkey: config.passkey,
        isEnabled: config.isEnabled ?? true,
        environment: config.environment || 'sandbox',
      },
    });
  }
}
