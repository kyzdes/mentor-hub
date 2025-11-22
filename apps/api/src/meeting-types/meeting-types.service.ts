import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMeetingTypeDto } from './dto/create-meeting-type.dto';
import { UpdateMeetingTypeDto } from './dto/update-meeting-type.dto';

@Injectable()
export class MeetingTypesService {
  constructor(private prisma: PrismaService) {}

  async create(mentorId: string, createMeetingTypeDto: CreateMeetingTypeDto) {
    const { name, slug, ...data } = createMeetingTypeDto;

    // Check if slug already exists for this mentor
    const existing = await this.prisma.meetingType.findUnique({
      where: {
        mentorId_slug: {
          mentorId,
          slug,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Meeting type with this slug already exists');
    }

    return this.prisma.meetingType.create({
      data: {
        mentorId,
        name,
        slug,
        ...data,
      },
    });
  }

  async findAll(mentorId?: string, isActive?: boolean) {
    return this.prisma.meetingType.findMany({
      where: {
        ...(mentorId && { mentorId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const meetingType = await this.prisma.meetingType.findUnique({
      where: { id },
      include: {
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!meetingType) {
      throw new NotFoundException('Meeting type not found');
    }

    return meetingType;
  }

  async findBySlug(mentorId: string, slug: string) {
    const meetingType = await this.prisma.meetingType.findUnique({
      where: {
        mentorId_slug: {
          mentorId,
          slug,
        },
      },
      include: {
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            timezone: true,
          },
        },
      },
    });

    if (!meetingType) {
      throw new NotFoundException('Meeting type not found');
    }

    return meetingType;
  }

  async update(id: string, updateMeetingTypeDto: UpdateMeetingTypeDto) {
    const meetingType = await this.findOne(id);

    // If slug is being updated, check for conflicts
    if (updateMeetingTypeDto.slug && updateMeetingTypeDto.slug !== meetingType.slug) {
      const existing = await this.prisma.meetingType.findUnique({
        where: {
          mentorId_slug: {
            mentorId: meetingType.mentorId,
            slug: updateMeetingTypeDto.slug,
          },
        },
      });

      if (existing) {
        throw new ConflictException('Meeting type with this slug already exists');
      }
    }

    return this.prisma.meetingType.update({
      where: { id },
      data: updateMeetingTypeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete - just mark as inactive
    return this.prisma.meetingType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    await this.findOne(id);

    return this.prisma.meetingType.delete({
      where: { id },
    });
  }

  async duplicate(id: string, mentorId: string) {
    const original = await this.findOne(id);

    const { id: _id, createdAt, updatedAt, slug, name, ...data } = original;

    return this.prisma.meetingType.create({
      data: {
        ...data,
        mentorId,
        name: `${name} (Copy)`,
        slug: `${slug}-copy-${Date.now()}`,
      },
    });
  }
}
