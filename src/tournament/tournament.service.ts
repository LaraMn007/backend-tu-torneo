import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

@Injectable()
export class TournamentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTournamentDto: CreateTournamentDto) {
    return this.prisma.tournament.create({
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
    return this.prisma.tournament.update({
      where: {
        idTournament: id,
      },
      data: updateTournamentDto,
    });
  }

  async remove(id: number) {
    return this.prisma.tournament.delete({
      where: {
        idTournament: id,
      },
    });
  }
}
