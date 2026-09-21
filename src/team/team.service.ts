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
    return this.prisma.team.findMany();
  }

  async findOne(id: number) {
    const team = await this.prisma.team.findUnique({
      where: {
        idTeam: id,
      },
    });

    if (!team) {
      throw new NotFoundException(`Equipo ${id} no encontrado`);
    }

    return team;
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
}


