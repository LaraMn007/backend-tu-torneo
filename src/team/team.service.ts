import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';

import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

const teamInclude = {
  players: { include: { player: true } },
} as const;

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto, currentUserId: number) {
    if (createTeamDto.ownerId !== currentUserId) {
      throw new ForbiddenException('No podés crear un equipo para otro usuario.');
    }
    try {
      const team = await this.prisma.team.create({
        data: {
          name: createTeamDto.name,
          categoryId: createTeamDto.categoryId,
          ownerId: currentUserId,
          primaryColor: createTeamDto.primaryColor,
          alternativeColor: createTeamDto.alternativeColor,
          image: createTeamDto.image,
          invitationCode: createTeamDto.invitationCode,
        },
        include: teamInclude,
      });
      return this.withPlayers(team);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `El código de invitación ${createTeamDto.invitationCode} ya existe`,
          );
        }

        if (error.code === 'P2003') {
          throw new NotFoundException(`Usuario o categoría relacionada no encontrada`);
        }
      }

      throw error;
    }
  }

  async findAllForUser(currentUserId: number) {
    // Usuarios autenticados pueden descubrir equipos para flujos de unión/solicitud.
    const teams = await this.prisma.team.findMany({ include: teamInclude });
    return teams.map(team => this.withPlayers(team));
  }

  async findByOwnerForUser(ownerId: number, currentUserId: number) {
    if (ownerId !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para ver los equipos de otro usuario.');
    }
    return this.findByOwner(ownerId);
  }

  async findByOwnerAndCategoryForUser(ownerId: number, categoryId: number, currentUserId: number) {
    if (ownerId !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para ver los equipos de otro usuario.');
    }
    const teams = await this.prisma.team.findMany({
      where: { ownerId, categoryId },
      include: teamInclude,
    });
    return teams.map(team => this.withPlayers(team));
  }

  private async findByOwner(ownerId: number) {
    const teams = await this.prisma.team.findMany({
      where: { ownerId },
      include: teamInclude,
    });
    return teams.map(team => this.withPlayers(team));
  }

  async findOneForUser(id: number, currentUserId: number) {
    const team = await this.prisma.team.findUnique({
      where: { idTeam: id },
      include: teamInclude,
    });

    if (!team) {
      throw new NotFoundException(`Equipo ${id} no encontrado`);
    }

    const isOwner = team.ownerId === currentUserId;
    const isMember = team.players.some(m => m.player.idUser === currentUserId);
    if (!isOwner && !isMember) {
      // Permitir lectura a usuarios autenticados para flujo de solicitud/unión por descubrimiento.
      // Se devuelve la representación estándar; operaciones de gestión siguen restringidas.
    }

    return this.withPlayers(team);
  }

  async addPlayer(teamId: number, playerId: number, currentUserId: number) {
    const team = await this.getTeamOrThrow(teamId);
    this.assertTeamOwner(team.ownerId, currentUserId);

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

    return this.findOneForUser(teamId, currentUserId);
  }

  async removePlayer(teamId: number, playerId: number, currentUserId: number) {
    const team = await this.getTeamOrThrow(teamId);
    const target = await this.prisma.player.findUnique({ where: { idPlayer: playerId } });
    if (!target) {
      throw new NotFoundException(`Jugador ${playerId} no encontrado`);
    }

    const isOwner = team.ownerId === currentUserId;
    const isSelf = target.idUser === currentUserId;
    if (!isOwner && !isSelf) {
      throw new ForbiddenException('No tenés permiso para quitar este jugador del equipo.');
    }

    const membership = await this.prisma.teamPlayer.findUnique({
      where: { teamId_playerId: { teamId, playerId } },
    });

    if (!membership) {
      throw new NotFoundException('El jugador no pertenece al equipo');
    }

    await this.prisma.teamPlayer.delete({
      where: { teamId_playerId: { teamId, playerId } },
    });
    return this.findOneForUser(teamId, currentUserId);
  }

  async update(id: number, updateTeamDto: UpdateTeamDto, currentUserId: number) {
    try {
      const team = await this.getTeamOrThrow(id);
      this.assertTeamOwner(team.ownerId, currentUserId);

      if (updateTeamDto.ownerId !== undefined && updateTeamDto.ownerId !== currentUserId) {
        throw new ForbiddenException('No podés transferir la propiedad del equipo.');
      }

      const { ownerId, ...safeData } = updateTeamDto;
      const updated = await this.prisma.team.update({
        where: { idTeam: id },
        data: safeData,
        include: teamInclude,
      });
      return this.withPlayers(updated);
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
          throw new NotFoundException(`Usuario o categoría relacionada no encontrada`);
        }
      }

      throw error;
    }
  }

  async remove(id: number, currentUserId: number) {
    try {
      const team = await this.getTeamOrThrow(id);
      this.assertTeamOwner(team.ownerId, currentUserId);

      await this.prisma.team.delete({
        where: { idTeam: id },
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

  private async getTeamOrThrow(teamId: number) {
    const team = await this.prisma.team.findUnique({
      where: { idTeam: teamId },
      include: teamInclude,
    });
    if (!team) {
      throw new NotFoundException(`Equipo ${teamId} no encontrado`);
    }
    return team;
  }

  private assertTeamOwner(ownerId: number, currentUserId: number): void {
    if (ownerId !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para gestionar este equipo.');
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
