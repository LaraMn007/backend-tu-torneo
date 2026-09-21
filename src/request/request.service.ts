import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';

import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

@Injectable()
export class RequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRequestDto: CreateRequestDto) {
    try {
      return await this.prisma.request.create({
        data: {
          idTeam: createRequestDto.idTeam,
          idPlayer: createRequestDto.idPlayer,
          type: createRequestDto.type,
          status: createRequestDto.status,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException(
            `Equipo o jugador relacionado no encontrado`,
          );
        }
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.request.findMany();
  }

  async findOne(id: number) {
    const request = await this.prisma.request.findUnique({
      where: {
        idRequest: id,
      },
    });

    if (!request) {
      throw new NotFoundException(`Solicitud ${id} no encontrada`);
    }

    return request;
  }

  async update(id: number, updateRequestDto: UpdateRequestDto) {
    try {
      return await this.prisma.request.update({
        where: {
          idRequest: id,
        },
        data: updateRequestDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Solicitud ${id} no encontrada`);
        }

        if (error.code === 'P2003') {
          throw new NotFoundException(
            `Equipo o jugador relacionado no encontrado`,
          );
        }
      }

      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.request.delete({
        where: {
          idRequest: id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Solicitud ${id} no encontrada`);
        }

        if (error.code === 'P2003') {
          throw new ConflictException(
            'La solicitud no puede ser eliminada porque tiene relaciones asociadas',
          );
        }
      }

      throw error;
    }
  }
}