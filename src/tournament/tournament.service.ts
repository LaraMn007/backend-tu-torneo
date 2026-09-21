
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

@Injectable()
export class TournamentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTournamentDto: CreateTournamentDto) {
    try {
      return await this.prisma.tournament.create({
        data: {
          name: createTournamentDto.name,
          categoryId: createTournamentDto.categoryId,
          description: createTournamentDto.description,
          estado: createTournamentDto.estado,
          owner: {
            connect: {
              idUser: createTournamentDto.idOwner,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException(
            `Usuario ${createTournamentDto.idOwner} no encontrado`,
          );
        }
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.tournament.findMany();
  }

  async findOne(id: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        idTournament: id,
      },
    });

    if (!tournament) {
      throw new NotFoundException(`Torneo ${id} no encontrado`);
    }

    return tournament;
  }

  async update(id: number, updateTournamentDto: UpdateTournamentDto) {
    try {
      const tournament = await this.prisma.tournament.findUnique({
        where: {
          idTournament: id,
        },
      });

      if (!tournament) {
        throw new NotFoundException(`Torneo ${id} no encontrado`);
      }

      return await this.prisma.tournament.update({
        where: {
          idTournament: id,
        },
        data: updateTournamentDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Torneo ${id} no encontrado`);
        }

        if (error.code === 'P2003') {
          throw new NotFoundException(
            `Usuario ${updateTournamentDto.idOwner ?? 'relacionado'} no encontrado`,
          );
        }
      }

      throw error;
    }
  }

  async remove(id: number) {
    try {
      const tournament = await this.prisma.tournament.findUnique({
        where: {
          idTournament: id,
        },
      });

      if (!tournament) {
        throw new NotFoundException(`Torneo ${id} no encontrado`);
      }

      await this.prisma.tournament.delete({
        where: {
          idTournament: id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Torneo ${id} no encontrado`);
        }

        if (error.code === 'P2003') {
          throw new ConflictException(
            'El torneo no puede ser eliminado porque tiene relaciones asociadas',
          );
        }
      }

      throw error;
    }
  }
}

