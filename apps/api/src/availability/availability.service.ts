import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { format, addDays, startOfDay, endOfDay, parse } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  // === RECURRING AVAILABILITY ===

  async createAvailability(mentorId: string, createAvailabilityDto: CreateAvailabilityDto) {
    return this.prisma.mentorAvailability.create({
      data: {
        mentorId,
        ...createAvailabilityDto,
      },
    });
  }

  async findAllAvailability(mentorId: string) {
    return this.prisma.mentorAvailability.findMany({
      where: { mentorId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOneAvailability(id: string) {
    const availability = await this.prisma.mentorAvailability.findUnique({
      where: { id },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    return availability;
  }

  async updateAvailability(id: string, updateAvailabilityDto: UpdateAvailabilityDto) {
    await this.findOneAvailability(id);

    return this.prisma.mentorAvailability.update({
      where: { id },
      data: updateAvailabilityDto,
    });
  }

  async removeAvailability(id: string) {
    await this.findOneAvailability(id);

    return this.prisma.mentorAvailability.delete({
      where: { id },
    });
  }

  // === EXCEPTIONS (BLOCKED DATES) ===

  async createException(mentorId: string, createExceptionDto: CreateExceptionDto) {
    return this.prisma.availabilityException.create({
      data: {
        mentorId,
        ...createExceptionDto,
      },
    });
  }

  async findAllExceptions(mentorId: string, startDate?: Date, endDate?: Date) {
    return this.prisma.availabilityException.findMany({
      where: {
        mentorId,
        ...(startDate &&
          endDate && {
            date: {
              gte: startDate,
              lte: endDate,
            },
          }),
      },
      orderBy: { date: 'asc' },
    });
  }

  async removeException(id: string) {
    return this.prisma.availabilityException.delete({
      where: { id },
    });
  }

  // === AVAILABLE TIME SLOTS ===

  async getAvailableSlots(
    mentorId: string,
    meetingTypeId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Get meeting type details
    const meetingType = await this.prisma.meetingType.findUnique({
      where: { id: meetingTypeId },
      include: { mentor: true },
    });

    if (!meetingType) {
      throw new NotFoundException('Meeting type not found');
    }

    const { duration } = meetingType;
    const timezone = meetingType.mentor.timezone;

    // Get recurring availability
    const availability = await this.findAllAvailability(mentorId);

    // Get exceptions (blocked dates)
    const exceptions = await this.findAllExceptions(mentorId, startDate, endDate);

    // Get existing bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        mentorId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generate available slots
    const slots = [];
    let currentDate = startOfDay(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      // Get availability for this day of week
      const dayAvailability = availability.filter((a) => a.dayOfWeek === dayOfWeek);

      for (const avail of dayAvailability) {
        // Check if this date is in exceptions
        const isException = exceptions.some((ex) => {
          const exDate = new Date(ex.date);
          return (
            exDate.getDate() === currentDate.getDate() &&
            exDate.getMonth() === currentDate.getMonth() &&
            exDate.getFullYear() === currentDate.getFullYear()
          );
        });

        if (isException) continue;

        // Parse start and end times
        const [startHour, startMinute] = avail.startTime.split(':').map(Number);
        const [endHour, endMinute] = avail.endTime.split(':').map(Number);

        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);

        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endHour, endMinute, 0, 0);

        // Generate slots with meeting duration
        while (slotStart < slotEnd) {
          const slotEndTime = new Date(slotStart.getTime() + duration * 60000);

          if (slotEndTime <= slotEnd) {
            // Check if slot conflicts with existing bookings
            const hasConflict = bookings.some((booking) => {
              return (
                (slotStart >= new Date(booking.startTime) &&
                  slotStart < new Date(booking.endTime)) ||
                (slotEndTime > new Date(booking.startTime) &&
                  slotEndTime <= new Date(booking.endTime)) ||
                (slotStart <= new Date(booking.startTime) &&
                  slotEndTime >= new Date(booking.endTime))
              );
            });

            if (!hasConflict && slotStart > new Date()) {
              slots.push({
                startTime: slotStart.toISOString(),
                endTime: slotEndTime.toISOString(),
                available: true,
              });
            }
          }

          // Move to next slot (using meeting duration)
          slotStart = new Date(slotStart.getTime() + duration * 60000);
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    return {
      timezone,
      duration,
      slots,
    };
  }
}
