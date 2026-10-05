import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';

import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto) {
    try {
      return await this.prisma.team.create({
        data: {
          name: createTeamDto.name,
          categoryId: createTeamDto.categoryId,
          ownerId: createTeamDto.ownerId,
          primaryColor: createTeamDto.primaryColor,
          alternativeColor: createTeamDto.alternativeColor,
          image: createTeamDto.image,
          invitationCode: createTeamDto.invitationCode,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `El código de invitación ${createTeamDto.invitationCode} ya existe`,
          );
        }

        if (error.code === 'P2003') {
          throw new NotFoundException(
            `Usuario o categoría relacionada no encontrada`,
          );
        }
      }

      throw error;
    }
  }

  async findAll() {
    const teams = await this.prisma.team.findMany({
      include: { players: { include: { player: true } } },
    });
    return teams.map(team => this.withPlayers(team));
  }

  async findByOwner(ownerId: number) {
    const teams = await this.prisma.team.findMany({
      where: { ownerId },
      include: { players: { include: { player: true } } },
    });
    return teams.map(team => this.withPlayers(team));
  }

  async findByOwnerAndCategory(ownerId: number, categoryId: number) {
    const teams = await this.prisma.team.findMany({
      where: { ownerId, categoryId },
      include: { players: { include: { player: true } } },
    });
    return teams.map(team => this.withPlayers(team));
  }

  async findOne(id: number) {
    const team = await this.prisma.team.findUnique({
      where: {
        idTeam: id,
      },
      include: { players: { include: { player: true } } },
    });

    if (!team) {
      throw new NotFoundException(`Equipo ${id} no encontrado`);
    }

    return this.withPlayers(team);
  }

  async addPlayer(teamId: number, playerId: number) {
    await this.ensureTeamAndPlayer(teamId, playerId);

    try {
      await this.prisma.teamPlayer.create({
        data: { teamId, playerId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('El jugador ya pertenece al equipo');
      }
      throw error;
    }

    return this.findOne(teamId);
  }

  async removePlayer(teamId: number, playerId: number) {
    await this.ensureTeamAndPlayer(teamId, playerId);
    const membership = await this.prisma.teamPlayer.findUnique({
      where: { teamId_playerId: { teamId, playerId } },
    });

    if (!membership) {
      throw new NotFoundException('El jugador no pertenece al equipo');
    }

    await this.prisma.teamPlayer.delete({
      where: { teamId_playerId: { teamId, playerId } },
    });
    return this.findOne(teamId);
  }

  async update(id: number, updateTeamDto: UpdateTeamDto) {
    try {
      const team = await this.prisma.team.findUnique({
        where: {
          idTeam: id,
        },
      });

      if (!team) {
        throw new NotFoundException(`Equipo ${id} no encontrado`);
      }

      return await this.prisma.team.update({
        where: {
          idTeam: id,
        },
        data: updateTeamDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Equipo ${id} no encontrado`);
        }

        if (error.code === 'P2002') {
          throw new ConflictException(
            `El código de invitación ${updateTeamDto.invitationCode} ya existe`,
          );
        }

        if (error.code === 'P2003') {
          throw new NotFoundException(
            `Usuario o categoría relacionada no encontrada`,
          );
        }
      }

      throw error;
    }
  }

  async remove(id: number) {
    try {
      const team = await this.prisma.team.findUnique({
        where: {
          idTeam: id,
        },
      });

      if (!team) {
        throw new NotFoundException(`Equipo ${id} no encontrado`);
      }

      await this.prisma.team.delete({
        where: {
          idTeam: id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Equipo ${id} no encontrado`);
        }

        if (error.code === 'P2003') {
          throw new ConflictException(
            'El equipo no puede ser eliminado porque tiene relaciones asociadas',
          );
        }
      }

      throw error;
    }
  }

  private async ensureTeamAndPlayer(teamId: number, playerId: number): Promise<void> {
    const [team, player] = await Promise.all([
      this.prisma.team.findUnique({ where: { idTeam: teamId } }),
      this.prisma.player.findUnique({ where: { idPlayer: playerId } }),
    ]);

    if (!team) throw new NotFoundException(`Equipo ${teamId} no encontrado`);
    if (!player) throw new NotFoundException(`Jugador ${playerId} no encontrado`);
  }

  private withPlayers<T extends { players: Array<{ player: unknown }> }>(team: T) {
    return { ...team, players: team.players.map(membership => membership.player) };
  }
}


