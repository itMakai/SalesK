import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';

@Injectable()
export class TableService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateTableDto) {
    // Verify branch belongs to tenant
    const branch = await this.prisma.extended.branch.findFirst({
      where: { id: dto.branchId, tenantId },
    });
    if (!branch) {
      throw new BadRequestException("Invalid branch");
    }

    return this.prisma.extended.table.create({
      data: dto,
    });
  }

  async findAll(tenantId: string, branchId?: string) {
    // Basic authorization checking could be more robust, but assuming branchId is validated by middleware if needed
    const where: any = {};
    if (branchId) {
      where.branchId = branchId;
    } else {
      // Find all branches for tenant and get their tables
      const branches = await this.prisma.extended.branch.findMany({
        where: { tenantId },
        select: { id: true },
      });
      where.branchId = { in: branches.map(b => b.id) };
    }

    return this.prisma.extended.table.findMany({
      where,
      orderBy: [
        { section: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(tenantId: string, id: string) {
    const table = await this.prisma.extended.table.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!table || table.branch.tenantId !== tenantId) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    return table;
  }

  async update(tenantId: string, id: string, dto: UpdateTableDto) {
    await this.findOne(tenantId, id); // Verify existence and access
    return this.prisma.extended.table.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.extended.table.delete({
      where: { id },
    });
  }
}
