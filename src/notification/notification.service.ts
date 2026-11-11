import {
  ConflictException,
  ForbiddenException,
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

  // Internal use by trusted server flows (request handling). Bypasses user ownership checks.
  async createInternal(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    teamId?: number;
    playerId?: number;
    read?: boolean;
  }) {
    try {
      return await this.prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          read: data.read ?? false,
          user: { connect: { idUser: data.userId } },
          ...(data.teamId !== undefined ? { team: { connect: { idTeam: data.teamId } } } : {}),
          ...(data.playerId !== undefined ? { player: { connect: { idPlayer: data.playerId } } } : {}),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException('Usuario, equipo o jugador relacionado no encontrado');
        }
      }
      throw error;
    }
  }

  async create(createNotificationDto: CreateNotificationDto, currentUserId: number) {
    // Users can only create notifications for themselves via API (if needed); internal flows use createInternal.
    if (createNotificationDto.userId !== currentUserId) {
      throw new ForbiddenException('No podés crear notificaciones para otro usuario.');
    }
    return this.createInternal(createNotificationDto);
  }

  async findAllForUser(currentUserId: number) {
    return this.prisma.notification.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, currentUserId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { idNotification: id },
    });

    if (!notification) {
      throw new NotFoundException(`Notificación ${id} no encontrada`);
    }
    if (notification.userId !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para ver esta notificación.');
    }

    return notification;
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto, currentUserId: number) {
    const existing = await this.findOne(id, currentUserId);
    // Only allow marking as read/unread for own notifications.
    if (updateNotificationDto.read === undefined) {
      return existing;
    }
    try {
      return await this.prisma.notification.update({
        where: { idNotification: id },
        data: { read: updateNotificationDto.read },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Notificación ${id} no encontrada`);
        }
      }
      throw error;
    }
  }

  async markAllRead(currentUserId: number) {
    await this.prisma.notification.updateMany({
      where: { userId: currentUserId, read: false },
      data: { read: true },
    });
    return { updated: true };
  }

  async remove(id: number, currentUserId: number) {
    await this.findOne(id, currentUserId);
    try {
      await this.prisma.notification.delete({
        where: { idNotification: id },
      });
      return { deleted: true };
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
