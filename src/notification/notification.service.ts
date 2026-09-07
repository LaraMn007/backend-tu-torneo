import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        read: createNotificationDto.read ?? false,

        user: {
          connect: {
            idUser: createNotificationDto.userId,
          },
        },

        ...(createNotificationDto.teamId !== undefined && {
          team: {
            connect: {
              idTeam: createNotificationDto.teamId,
            },
          },
        }),

        ...(createNotificationDto.playerId !== undefined && {
          player: {
            connect: {
              idPlayer: createNotificationDto.playerId,
            },
          },
        }),
      },
    });
  }

  async findAll() {
    return this.prisma.notification.findMany();
  }

  async findOne(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        idNotification: id,
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notificación ${id} no encontrada`);
    }

    return notification;
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return this.prisma.notification.update({
      where: {
        idNotification: id,
      },
      data: updateNotificationDto,
    });
  }

  async remove(id: number) {
    return this.prisma.notification.delete({
      where: {
        idNotification: id,
      },
    });
  }
}
