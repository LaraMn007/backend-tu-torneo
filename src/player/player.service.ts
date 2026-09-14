import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createPlayerDto: CreatePlayerDto) {
    return this.prisma.player.create({
      data: {
        name: createPlayerDto.name,
        dateBirth: new Date(createPlayerDto.dateBirth),
        idUser: createPlayerDto.idUser,
      },
    });
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

    return this.prisma.player.update({
      where: {
        idPlayer: id,
      },
      data: updatePlayerDto,
    });
  }

  async remove(id: number) {
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

    await this.prisma.player.delete({
      where: {
        idPlayer: id,
      },
    });
  }
}
