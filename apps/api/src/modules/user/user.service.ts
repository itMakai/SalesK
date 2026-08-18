import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@salesk/shared';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.extended.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        staffAssignments: {
          select: { branch: { select: { id: true, name: true } }, roleAtBranch: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.extended.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, role: true, isActive: true, lastLoginAt: true, createdAt: true,
        staffAssignments: {
          select: { branch: { select: { id: true, name: true } }, roleAtBranch: true },
        },
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async invite(tenantId: string, dto: {
    firstName: string; lastName: string; email: string;
    phone?: string; role: string; password: string; branchIds?: string[];
  }) {
    // Check for existing user in tenant
    const existing = await this.prisma.extended.user.findFirst({
      where: { tenantId, email: dto.email },
    });
    if (existing) throw new ConflictException('A user with this email already exists in your tenant');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await (tx as any).user.create({
        data: {
          tenantId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          role: dto.role,
          passwordHash,
        },
      });

      // Assign to branches if specified
      if (dto.branchIds?.length) {
        await (tx as any).staffAssignment.createMany({
          data: dto.branchIds.map((branchId) => ({
            userId: user.id,
            branchId,
            roleAtBranch: dto.role,
          })),
        });
      }

      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    });
  }

  async update(id: string, tenantId: string, dto: {
    firstName?: string; lastName?: string; phone?: string; role?: string; isActive?: boolean; branchIds?: string[];
  }) {
    await this.findOne(id, tenantId);

    return this.prisma.$transaction(async (tx) => {
      const user = await (tx as any).user.update({
        where: { id },
        data: {
          ...(dto.firstName && { firstName: dto.firstName }),
          ...(dto.lastName && { lastName: dto.lastName }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.role && { role: dto.role }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });

      // Update branch assignments if specified
      if (dto.branchIds !== undefined) {
        await (tx as any).staffAssignment.deleteMany({ where: { userId: id } });
        if (dto.branchIds.length) {
          await (tx as any).staffAssignment.createMany({
            data: dto.branchIds.map((branchId) => ({
              userId: id,
              branchId,
              roleAtBranch: dto.role || user.role,
            })),
          });
        }
      }

      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    });
  }

  async deactivate(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.extended.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }

  async resetPin(id: string, tenantId: string, pin: string) {
    await this.findOne(id, tenantId);
    if (!/^\d{4}$/.test(pin)) throw new BadRequestException('PIN must be exactly 4 digits');
    const pinHash = await bcrypt.hash(pin, 10);
    return this.prisma.extended.user.update({
      where: { id },
      data: { pin: pinHash },
      select: { id: true },
    });
  }
}
