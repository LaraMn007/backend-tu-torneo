
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
    const tournaments = await this.prisma.tournament.findMany({
      include: { teams: { include: { team: { include: { players: { include: { player: true } } } } } } }});
    return tournaments.map(tournament => this.withTeams(tournament));
  }

  async findByOwner(ownerId: number) {
    const tournaments = await this.prisma.tournament.findMany({
      where: { idOwner: ownerId },
      include: { teams: { include: { team: { include: { players: { include: { player: true } } } } } }},
    });
    return tournaments.map(tournament => this.withTeams(tournament));
  }

  async findOne(id: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        idTournament: id,
      },
      include: { teams: { include: { team: { include: { players: { include: { player: true } } } } } },
    }});

    if (!tournament) {
      throw new NotFoundException(`Torneo ${id} no encontrado`);
    }

    return this.withTeams(tournament);
  }

  async addTeam(tournamentId: number, teamId: number) {
    await this.ensureTournamentAndTeam(tournamentId, teamId);

    try {
      await this.prisma.tournamentTeam.create({
        data: { tournamentId, teamId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('El equipo ya está inscrito en el torneo');
      }
      throw error;
    }

    return this.findOne(tournamentId);
  }

  async removeTeam(tournamentId: number, teamId: number) {
    await this.ensureTournamentAndTeam(tournamentId, teamId);
    const registration = await this.prisma.tournamentTeam.findUnique({
      where: { tournamentId_teamId: { tournamentId, teamId } },
    });

    if (!registration) {
      throw new NotFoundException('El equipo no está inscrito en el torneo');
    }

    await this.prisma.tournamentTeam.delete({
      where: { tournamentId_teamId: { tournamentId, teamId } },
    });
    return this.findOne(tournamentId);
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

      const { idOwner, name, categoryId, description, estado } = updateTournamentDto;

      return await this.prisma.tournament.update({
        where: {
          idTournament: id,
        },
        data: {
          ...(name !== undefined && { name }),
          ...(categoryId !== undefined && { categoryId }),
          ...(description !== undefined && { description }),
          ...(estado !== undefined && { estado }),
          ...(idOwner !== undefined && {
            owner: { connect: { idUser: idOwner } },
          }),
        },
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

  private async ensureTournamentAndTeam(tournamentId: number, teamId: number): Promise<void> {
    const [tournament, team] = await Promise.all([
      this.prisma.tournament.findUnique({ where: { idTournament: tournamentId } }),
      this.prisma.team.findUnique({ where: { idTeam: teamId } }),
    ]);

    if (!tournament) throw new NotFoundException(`Torneo ${tournamentId} no encontrado`);
    if (!team) throw new NotFoundException(`Equipo ${teamId} no encontrado`);
  }

  private withTeams<T extends { teams: Array<{ team: { players: Array<{ player: unknown }> } }> }>(tournament: T) {
    return {
      ...tournament,
      teams: tournament.teams.map(registration => ({
        ...registration.team,
        players: registration.team.players.map(membership => membership.player),
      })),
    };
  }
}

