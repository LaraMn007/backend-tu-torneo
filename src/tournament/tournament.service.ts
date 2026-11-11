import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

const matchInclude = {
  teamA: { include: { players: { include: { player: true } } } },
  teamB: { include: { players: { include: { player: true } } } },
  winner: true,
} as const;

const tournamentInclude = {
  owner: { select: { idUser: true, name: true } },
  teams: { include: { team: { include: { players: { include: { player: true } } } } } },
} as const;

@Injectable()
export class TournamentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTournamentDto: CreateTournamentDto, currentUserId: number) {
    if (createTournamentDto.idOwner !== currentUserId) {
      throw new ForbiddenException('No podés crear un torneo para otro usuario.');
    }
    try {
      const tournament = await this.prisma.tournament.create({
        data: {
          name: createTournamentDto.name,
          categoryId: createTournamentDto.categoryId,
          ...(createTournamentDto.description !== undefined
            ? { description: createTournamentDto.description }
            : {}),
          estado: createTournamentDto.estado,
          owner: { connect: { idUser: currentUserId } },
        },
        include: tournamentInclude,
      });
      return this.withTeams(tournament);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException(`Usuario ${currentUserId} no encontrado`);
        }
      }

      throw error;
    }
  }

  async findAllForUser(currentUserId: number) {
    // Descubrimiento/inscripción: muestra torneos de otros usuarios; los propios se ven en "mis torneos".
    const tournaments = await this.prisma.tournament.findMany({
      where: { idOwner: { not: currentUserId } },
      include: tournamentInclude,
    });
    return tournaments.map(tournament => this.withTeams(tournament));
  }

  async findByOwnerForUser(ownerId: number, currentUserId: number) {
    if (ownerId !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para ver los torneos de otro usuario.');
    }
    const tournaments = await this.prisma.tournament.findMany({
      where: { idOwner: ownerId },
      include: tournamentInclude,
    });
    return tournaments.map(tournament => this.withTeams(tournament));
  }

  async findOneForUser(id: number, _currentUserId: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { idTournament: id },
      include: tournamentInclude,
    });

    if (!tournament) {
      throw new NotFoundException(`Torneo ${id} no encontrado`);
    }

    return this.withTeams(tournament);
  }

  async addTeam(tournamentId: number, teamId: number, currentUserId: number) {
    const tournament = await this.getTournamentOrThrow(tournamentId);
    const team = await this.prisma.team.findUnique({ where: { idTeam: teamId } });
    if (!team) throw new NotFoundException(`Equipo ${teamId} no encontrado`);

    const canManage = tournament.idOwner === currentUserId || team.ownerId === currentUserId;
    if (!canManage) {
      throw new ForbiddenException('No tenés permiso para inscribir este equipo en el torneo.');
    }

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

    return this.findOneForUser(tournamentId, currentUserId);
  }

  async removeTeam(tournamentId: number, teamId: number, currentUserId: number) {
    const tournament = await this.getTournamentOrThrow(tournamentId);
    const team = await this.prisma.team.findUnique({ where: { idTeam: teamId } });
    if (!team) throw new NotFoundException(`Equipo ${teamId} no encontrado`);

    const canManage = tournament.idOwner === currentUserId || team.ownerId === currentUserId;
    if (!canManage) {
      throw new ForbiddenException('No tenés permiso para quitar este equipo del torneo.');
    }

    const registration = await this.prisma.tournamentTeam.findUnique({
      where: { tournamentId_teamId: { tournamentId, teamId } },
    });

    if (!registration) {
      throw new NotFoundException('El equipo no está inscrito en el torneo');
    }

    await this.prisma.tournamentTeam.delete({
      where: { tournamentId_teamId: { tournamentId, teamId } },
    });
    return this.findOneForUser(tournamentId, currentUserId);
  }

  async update(id: number, updateTournamentDto: UpdateTournamentDto, currentUserId: number) {
    try {
      const tournament = await this.getTournamentOrThrow(id);
      if (tournament.idOwner !== currentUserId) {
        throw new ForbiddenException('No tenés permiso para gestionar este torneo.');
      }

      const { idOwner, name, categoryId, description, estado } = updateTournamentDto;
      if (idOwner !== undefined && idOwner !== currentUserId) {
        throw new ForbiddenException('No podés transferir la propiedad del torneo.');
      }

      const updated = await this.prisma.tournament.update({
        where: { idTournament: id },
        data: {
          ...(name !== undefined && { name }),
          ...(categoryId !== undefined && { categoryId }),
          ...(description !== undefined ? { description } : {}),
          ...(estado !== undefined && { estado }),
        },
        include: tournamentInclude,
      });
      return this.withTeams(updated);
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

  async remove(id: number, currentUserId: number) {
    try {
      const tournament = await this.getTournamentOrThrow(id);
      if (tournament.idOwner !== currentUserId) {
        throw new ForbiddenException('No tenés permiso para eliminar este torneo.');
      }

      await this.prisma.tournament.delete({
        where: { idTournament: id },
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

  private async getTournamentOrThrow(tournamentId: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { idTournament: tournamentId },
      include: tournamentInclude,
    });
    if (!tournament) {
      throw new NotFoundException(`Torneo ${tournamentId} no encontrado`);
    }
    return tournament;
  }

  async draw(tournamentId: number, currentUserId: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { idTournament: tournamentId },
      include: { teams: { include: { team: true } }, matches: true },
    });
    if (!tournament) throw new NotFoundException(`Torneo ${tournamentId} no encontrado`);
    if (tournament.idOwner !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para sortear este torneo.');
    }
    if (tournament.teams.length < 2) {
      throw new BadRequestException('El torneo necesita al menos 2 equipos para sortear.');
    }
    if (tournament.matches.length > 0) {
      return this.findMatchesByTournament(tournamentId);
    }

    const pairings = this.generateRoundRobin(tournament.teams.map(t => t.teamId));

    await this.prisma.$transaction(async tx => {
      for (const p of pairings) {
        await tx.match.create({
          data: {
            idTournament: tournamentId,
            round: p.round,
            teamAId: p.teamAId,
            teamBId: p.teamBId,
            status: 'PENDIENTE',
          },
        });
      }
      if (tournament.estado === 'ABIERTO') {
        await tx.tournament.update({
          where: { idTournament: tournamentId },
          data: { estado: 'EN_CURSO' },
        });
      }
    });

    return this.findMatchesByTournament(tournamentId);
  }

  private async findMatchesByTournament(tournamentId: number) {
    const matches = await this.prisma.match.findMany({
      where: { idTournament: tournamentId },
      include: matchInclude,
      orderBy: [{ round: 'asc' }, { idMatch: 'asc' }],
    });
    return matches.map(m => this.withMatchTeams(m));
  }

  private generateRoundRobin(teamIds: number[]): Array<{ round: number; teamAId: number; teamBId: number }> {
    const teams = [...teamIds];
    if (teams.length % 2 !== 0) teams.push(-1);
    const totalRounds = teams.length - 1;
    const matchesPerRound = teams.length / 2;
    let rotated = [...teams];
    const result: Array<{ round: number; teamAId: number; teamBId: number }> = [];
    for (let round = 0; round < totalRounds; round++) {
      for (let i = 0; i < matchesPerRound; i++) {
        const a = rotated[i];
        const b = rotated[rotated.length - 1 - i];
        if (a !== -1 && b !== -1) {
          result.push({ round: round + 1, teamAId: a, teamBId: b });
        }
      }
      const fixed = rotated[0];
      const rest = rotated.slice(1);
      const last = rest.pop();
      if (last !== undefined) rest.unshift(last);
      rotated = [fixed, ...rest];
    }
    return result;
  }

  private withMatchTeams<T extends { teamA: { players: Array<{ player: unknown }> }; teamB: { players: Array<{ player: unknown }> } }>(match: T) {
    return {
      ...match,
      teamA: { ...match.teamA, players: match.teamA.players.map(m => m.player) },
      teamB: { ...match.teamB, players: match.teamB.players.map(m => m.player) },
    };
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
