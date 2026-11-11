import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPlayerDto: CreatePlayerDto, currentUserId: number) {
    if (createPlayerDto.idUser !== currentUserId) {
      throw new ForbiddenException('No podés crear un jugador para otro usuario.');
    }

    try {
      return await this.prisma.player.create({
        data: {
          name: createPlayerDto.name,
          dateBirth: new Date(createPlayerDto.dateBirth),
          idUser: currentUserId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException(`Usuario ${currentUserId} no encontrado`);
        }

        if (error.code === 'P2002') {
          throw new ConflictException(`El jugador ${createPlayerDto.name} ya existe`);
        }
      }

      throw error;
    }
  }

  async findByUser(userId: number) {
    const player = await this.prisma.player.findFirst({
      where: { idUser: userId },
    });

    if (!player) {
      throw new NotFoundException(`Jugador del usuario ${userId} no encontrado`);
    }

    return player;
  }

  async findByUserForUser(userId: number, currentUserId: number) {
    if (userId !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para acceder a este jugador.');
    }
    return this.findByUser(userId);
  }

  async findOneForUser(id: number, currentUserId: number) {
    const player = await this.prisma.player.findUnique({
      where: { idPlayer: id },
    });

    if (!player) {
      throw new NotFoundException(`Jugador ${id} no encontrado`);
    }
    if (player.idUser !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para acceder a este jugador.');
    }

    return player;
  }

  async update(id: number, updatePlayerDto: UpdatePlayerDto, currentUserId: number) {
    await this.findOneForUser(id, currentUserId);
    try {
      return await this.prisma.player.update({
        where: { idPlayer: id },
        data: {
          ...(updatePlayerDto.name !== undefined ? { name: updatePlayerDto.name } : {}),
          ...(updatePlayerDto.dateBirth !== undefined
            ? { dateBirth: new Date(updatePlayerDto.dateBirth) }
            : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Jugador ${id} no encontrado`);
      }

      throw error;
    }
  }

  async remove(id: number, currentUserId: number): Promise<void> {
    await this.findOneForUser(id, currentUserId);
    try {
      await this.prisma.player.delete({
        where: { idPlayer: id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Jugador ${id} no encontrado`);
        }

        if (error.code === 'P2003') {
          throw new ConflictException(
            'El jugador no puede ser eliminado porque tiene relaciones asociadas',
          );
        }
      }

      throw error;
    }
  }
}
