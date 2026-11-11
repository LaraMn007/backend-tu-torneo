import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, RequestStatus, RequestType } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

@Injectable()
export class RequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async create(createRequestDto: CreateRequestDto, currentUserId: number) {
    const team = await this.prisma.team.findUnique({
      where: { idTeam: createRequestDto.idTeam },
      include: { players: { include: { player: true } } },
    });
    if (!team) throw new NotFoundException(`Equipo ${createRequestDto.idTeam} no encontrado`);

    const player = await this.prisma.player.findUnique({ where: { idPlayer: createRequestDto.idPlayer } });
    if (!player) throw new NotFoundException(`Jugador ${createRequestDto.idPlayer} no encontrado`);

    if (createRequestDto.type === RequestType.Unirse) {
      if (player.idUser !== currentUserId) {
        throw new ForbiddenException('Solo podés solicitar unirte con tu propio jugador.');
      }
    } else if (createRequestDto.type === RequestType.Invitar) {
      if (team.ownerId !== currentUserId) {
        throw new ForbiddenException('Solo el dueño del equipo puede invitar jugadores.');
      }
    } else {
      throw new BadRequestException('Tipo de solicitud inválido.');
    }

    const alreadyMember = team.players.some(m => m.playerId === player.idPlayer);
    if (alreadyMember) {
      throw new ConflictException('El jugador ya pertenece al equipo.');
    }

    const existingPending = await this.prisma.request.findFirst({
      where: {
        idTeam: team.idTeam,
        idPlayer: player.idPlayer,
        status: RequestStatus.Pendiente,
      },
    });
    if (existingPending) {
      throw new ConflictException('Ya existe una solicitud pendiente para este jugador y equipo.');
    }

    const request = await this.prisma.request.create({
      data: {
        idTeam: team.idTeam,
        idPlayer: player.idPlayer,
        type: createRequestDto.type,
        status: RequestStatus.Pendiente,
      },
    });

    if (request.type === RequestType.Unirse) {
      await this.notifications.createInternal({
        userId: team.ownerId,
        type: 'join_request',
        title: 'Nueva solicitud',
        message: `${player.name} solicitó unirse a ${team.name}`,
        teamId: team.idTeam,
        playerId: player.idPlayer,
      });
    } else {
      await this.notifications.createInternal({
        userId: player.idUser,
        type: 'team_invitation',
        title: 'Invitación de equipo',
        message: `Fuiste invitado al equipo ${team.name}`,
        teamId: team.idTeam,
        playerId: player.idPlayer,
      });
    }

    return request;
  }

  async findAllForUser(currentUserId: number) {
    const player = await this.prisma.player.findFirst({ where: { idUser: currentUserId } });
    return this.prisma.request.findMany({
      where: {
        OR: [
          { team: { ownerId: currentUserId } },
          ...(player ? [{ idPlayer: player.idPlayer }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTeam(teamId: number, currentUserId: number) {
    const team = await this.prisma.team.findUnique({ where: { idTeam: teamId } });
    if (!team) throw new NotFoundException(`Equipo ${teamId} no encontrado`);
    if (team.ownerId !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para ver las solicitudes de este equipo.');
    }
    return this.prisma.request.findMany({ where: { idTeam: teamId }, orderBy: { createdAt: 'desc' } });
  }

  async findByPlayer(playerId: number, currentUserId: number) {
    const player = await this.prisma.player.findUnique({ where: { idPlayer: playerId } });
    if (!player) throw new NotFoundException(`Jugador ${playerId} no encontrado`);
    if (player.idUser !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para ver las solicitudes de este jugador.');
    }
    return this.prisma.request.findMany({ where: { idPlayer: playerId }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number, currentUserId: number) {
    const request = await this.prisma.request.findUnique({
      where: { idRequest: id },
      include: { team: true, player: true },
    });

    if (!request) {
      throw new NotFoundException(`Solicitud ${id} no encontrada`);
    }

    const involved = request.team.ownerId === currentUserId || request.player.idUser === currentUserId;
    if (!involved) {
      throw new ForbiddenException('No tenés permiso para ver esta solicitud.');
    }

    const { team, player, ...rest } = request;
    return rest;
  }

  async updateStatus(id: number, status: RequestStatus, currentUserId: number) {
    if (status === RequestStatus.Pendiente) {
      throw new BadRequestException('No se puede volver una solicitud a estado pendiente.');
    }

    const request = await this.prisma.request.findUnique({
      where: { idRequest: id },
      include: { team: true, player: true },
    });
    if (!request) throw new NotFoundException(`Solicitud ${id} no encontrada`);
    if (request.status !== RequestStatus.Pendiente) {
      throw new ConflictException('La solicitud ya fue resuelta.');
    }

    const isOwner = request.team.ownerId === currentUserId;
    const isPlayerUser = request.player.idUser === currentUserId;

    if (request.type === RequestType.Unirse && !isOwner) {
      throw new ForbiddenException('Solo el dueño del equipo puede resolver esta solicitud.');
    }
    if (request.type === RequestType.Invitar && !isPlayerUser) {
      throw new ForbiddenException('Solo el jugador invitado puede responder esta invitación.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (status === RequestStatus.Aceptada) {
        const membership = await tx.teamPlayer.findUnique({
          where: { teamId_playerId: { teamId: request.idTeam, playerId: request.idPlayer } },
        });
        if (!membership) {
          await tx.teamPlayer.create({
            data: { teamId: request.idTeam, playerId: request.idPlayer },
          });
        }
      }

      return tx.request.update({
        where: { idRequest: id },
        data: { status },
      });
    });

    if (status === RequestStatus.Aceptada) {
      if (request.type === RequestType.Unirse) {
        await this.notifications.createInternal({
          userId: request.player.idUser,
          type: 'request_response',
          title: 'Solicitud aceptada',
          message: `Fuiste aceptado en el equipo ${request.team.name}`,
          teamId: request.team.idTeam,
          playerId: request.player.idPlayer,
        });
      } else {
        await this.notifications.createInternal({
          userId: request.team.ownerId,
          type: 'team_response',
          title: 'Invitación aceptada',
          message: `${request.player.name} aceptó la invitación a ${request.team.name}`,
          teamId: request.team.idTeam,
          playerId: request.player.idPlayer,
        });
      }
    } else {
      const targetUserId = request.type === RequestType.Unirse ? request.player.idUser : request.team.ownerId;
      await this.notifications.createInternal({
        userId: targetUserId,
        type: 'request_response',
        title: request.type === RequestType.Unirse ? 'Solicitud rechazada' : 'Invitación rechazada',
        message: request.type === RequestType.Unirse
          ? `Tu solicitud fue rechazada en ${request.team.name}`
          : `${request.player.name} rechazó la invitación a ${request.team.name}`,
        teamId: request.team.idTeam,
        playerId: request.player.idPlayer,
      });
    }

    return updated;
  }

  // Kept for compatibility but restricted.
  async update(id: number, updateRequestDto: UpdateRequestDto, currentUserId: number) {
    if (updateRequestDto.status) {
      return this.updateStatus(id, updateRequestDto.status, currentUserId);
    }
    throw new BadRequestException('Solo se permite actualizar el estado de la solicitud.');
  }

  async remove(id: number, currentUserId: number) {
    const request = await this.prisma.request.findUnique({
      where: { idRequest: id },
      include: { team: true, player: true },
    });
    if (!request) throw new NotFoundException(`Solicitud ${id} no encontrada`);

    const involved = request.team.ownerId === currentUserId || request.player.idUser === currentUserId;
    if (!involved) {
      throw new ForbiddenException('No tenés permiso para eliminar esta solicitud.');
    }

    await this.prisma.request.delete({ where: { idRequest: id } });
    return { deleted: true };
  }
}
