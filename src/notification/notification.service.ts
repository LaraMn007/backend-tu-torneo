import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    try {
      return await this.prisma.notification.create({
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException(
            'Usuario, equipo o jugador relacionado no encontrado',
          );
        }
      }

      throw error;
    }
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
    try {
      return await this.prisma.notification.update({
        where: {
          idNotification: id,
        },
        data: updateNotificationDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Notificación ${id} no encontrada`);
        }

        if (error.code === 'P2003') {
          throw new NotFoundException(
            'Usuario, equipo o jugador relacionado no encontrado',
          );
        }
      }

      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.notification.delete({
        where: {
          idNotification: id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Notificación ${id} no encontrada`);
        }

        if (error.code === 'P2003') {
          throw new ConflictException(
            'La notificación no puede ser eliminada porque tiene relaciones asociadas',
          );
        }
      }

      throw error;
    }
  }
}
