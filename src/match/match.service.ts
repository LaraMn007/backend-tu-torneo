import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMatchDto } from './dto/update-match.dto';

const MatchStatus = {
  PENDIENTE: 'PENDIENTE',
  FINALIZADO: 'FINALIZADO',
} as const;

const matchInclude = {
  teamA: { include: { players: { include: { player: true } } } },
  teamB: { include: { players: { include: { player: true } } } },
  winner: true,
} as const;

@Injectable()
export class MatchService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTournament(tournamentId: number, _currentUserId: number) {
    const tournament = await this.prisma.tournament.findUnique({ where: { idTournament: tournamentId } });
    if (!tournament) throw new NotFoundException(`Torneo ${tournamentId} no encontrado`);

    const matches = await this.prisma.match.findMany({
      where: { idTournament: tournamentId },
      include: matchInclude,
      orderBy: [{ round: 'asc' }, { idMatch: 'asc' }],
    });
    return matches.map(m => this.withTeams(m));
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
      // Sorteo ya guardado: devolver existente (idempotente)
      return this.findByTournament(tournamentId, currentUserId);
    }

    const teams = tournament.teams.map(t => t.team);
    const pairings = this.generateRoundRobin(teams.map(t => t.idTeam));

    await this.prisma.$transaction(async tx => {
      for (const p of pairings) {
        await tx.match.create({
          data: {
            idTournament: tournamentId,
            round: p.round,
            teamAId: p.teamAId,
            teamBId: p.teamBId,
            status: MatchStatus.PENDIENTE,
          },
        });
      }
      // Asegurar estado EN_CURSO al sortear/guardar sorteo
      if (tournament.estado === 'ABIERTO') {
        await tx.tournament.update({
          where: { idTournament: tournamentId },
          data: { estado: 'EN_CURSO' },
        });
      }
    });

    return this.findByTournament(tournamentId, currentUserId);
  }

  async update(idMatch: number, dto: UpdateMatchDto, currentUserId: number) {
    const match = await this.prisma.match.findUnique({
      where: { idMatch },
      include: { tournament: true },
    });
    if (!match) throw new NotFoundException(`Partido ${idMatch} no encontrado`);
    if (match.tournament.idOwner !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para gestionar este partido.');
    }
    if (match.status === MatchStatus.FINALIZADO) {
      throw new ConflictException('El partido ya está cerrado/finalizado.');
    }

    const closing = dto.scoreA !== undefined || dto.scoreB !== undefined || dto.winnerTeamId !== undefined;
    if (closing) {
      if (dto.scoreA === undefined || dto.scoreB === undefined || dto.winnerTeamId === undefined) {
        throw new BadRequestException('Para cerrar el partido debes indicar marcador (scoreA, scoreB) y ganador (winnerTeamId).');
      }
      if (dto.winnerTeamId !== match.teamAId && dto.winnerTeamId !== match.teamBId) {
        throw new BadRequestException('El ganador debe ser uno de los equipos del partido.');
      }
      // Coherencia básica marcador-ganador
      if (dto.scoreA === dto.scoreB) {
        throw new BadRequestException('El marcador no puede ser empate para cerrar el partido con un ganador.');
      }
      const winnerByScore = dto.scoreA > dto.scoreB ? match.teamAId : match.teamBId;
      if (winnerByScore !== dto.winnerTeamId) {
        throw new BadRequestException('El ganador no coincide con el marcador.');
      }
    }

    const data: any = {};
    if (dto.scheduledDate !== undefined) data.scheduledDate = dto.scheduledDate;
    if (dto.scheduledTime !== undefined) data.scheduledTime = dto.scheduledTime;
    if (closing) {
      data.scoreA = dto.scoreA;
      data.scoreB = dto.scoreB;
      data.status = MatchStatus.FINALIZADO;
      data.winnerTeamId = dto.winnerTeamId;
    }

    try {
      const updated = await this.prisma.match.update({
        where: { idMatch },
        data,
        include: matchInclude,
      });
      return this.withTeams(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Partido ${idMatch} no encontrado`);
      }
      throw error;
    }
  }

  private generateRoundRobin(teamIds: number[]): Array<{ round: number; teamAId: number; teamBId: number }> {
    const teams = [...teamIds];
    if (teams.length % 2 !== 0) teams.push(-1); // bye

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

  private withTeams<T extends { teamA: { players: Array<{ player: unknown }> }; teamB: { players: Array<{ player: unknown }> } }>(match: T) {
    return {
      ...match,
      teamA: { ...match.teamA, players: match.teamA.players.map(m => m.player) },
      teamB: { ...match.teamB, players: match.teamB.players.map(m => m.player) },
    };
  }
}
