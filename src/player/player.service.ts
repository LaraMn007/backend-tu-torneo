import {
  ConflictException,
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

  async create(createPlayerDto: CreatePlayerDto) {
    try {
      return await this.prisma.player.create({
        data: {
          name: createPlayerDto.name,
          dateBirth: new Date(createPlayerDto.dateBirth),
          idUser: createPlayerDto.idUser,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException(
          `Usuario ${createPlayerDto.idUser} no encontrado`,
        );
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.player.findMany();
  }

  async findOne(id: number) {
    const player = await this.prisma.player.findUnique({
      where: {
        idPlayer: id,
      },
    });

    if (!player) {
      throw new NotFoundException(
        `Jugador ${id} no encontrado`,
      );
    }

    return player;
  }

  async update(
    id: number,
    updatePlayerDto: UpdatePlayerDto,
  ) {
    try {
      return await this.prisma.player.update({
        where: {
          idPlayer: id,
        },
        data: {
          ...updatePlayerDto,
          dateBirth: updatePlayerDto.dateBirth
            ? new Date(updatePlayerDto.dateBirth)
            : undefined,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Jugador ${id} no encontrado`,
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.player.delete({
        where: {
          idPlayer: id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Jugador ${id} no encontrado`,
          );
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