import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamService {
     constructor(private readonly prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto) {
    return this.prisma.team.create({
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
    return this.prisma.team.update({
      where: {
        idTeam: id,
      },
      data: updateTeamDto,
    });
  }

  async remove(id: number) {
    return this.prisma.team.delete({
      where: {
        idTeam: id,
      },
    });
  }
}

