import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SmsService } from '../notification/sms.service';

@Injectable()
export class AppointmentService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService
  ) {}

  async create(branchId: string, data: any) {
    // Optional: add validation or SMS trigger here
    const appointment = await this.prisma.extended.appointment.create({
      data: {
        ...data,
        branchId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
      include: {
        customer: true,
        staff: true,
        service: true,
      }
    });

    if (appointment.customer?.phone) {
      await this.smsService.sendAppointmentReminder(
        appointment.customer.phone,
        appointment.customer.name,
        appointment.service?.name || 'Service',
        appointment.startTime
      );
    }

    return appointment;
  }

  async findAll(branchId: string, start?: string, end?: string) {
    const where: any = { branchId };
    
    if (start && end) {
      where.startTime = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    return this.prisma.extended.appointment.findMany({
      where,
      include: {
        customer: true,
        staff: true,
        service: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(branchId: string, id: string) {
    const appointment = await this.prisma.extended.appointment.findUnique({
      where: { id, branchId },
      include: {
        customer: true,
        staff: true,
        service: true,
      }
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async update(branchId: string, id: string, data: any) {
    const appointment = await this.findOne(branchId, id);
    
    const updateData = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);

    // No-show tracking logic
    if (data.status === 'no-show' && appointment.status !== 'no-show') {
      if (appointment.customerId) {
        await this.prisma.extended.customer.update({
          where: { id: appointment.customerId },
          data: { noShowCount: { increment: 1 } },
        });
      }
    } else if (appointment.status === 'no-show' && data.status && data.status !== 'no-show') {
      // Revert if status changes away from no-show
      if (appointment.customerId) {
        await this.prisma.extended.customer.update({
          where: { id: appointment.customerId },
          data: { noShowCount: { decrement: 1 } },
        });
      }
    }

    return this.prisma.extended.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        staff: true,
        service: true,
      }
    });
  }

  async remove(branchId: string, id: string) {
    const appointment = await this.findOne(branchId, id);
    return this.prisma.extended.appointment.delete({
      where: { id: appointment.id },
    });
  }
}
