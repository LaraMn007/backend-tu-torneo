import {Injectable,NotFoundException,} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

@Injectable()
export class RequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRequestDto: CreateRequestDto) {
    return this.prisma.request.create({
      data: {
        idTeam: createRequestDto.idTeam,
        idPlayer: createRequestDto.idPlayer,
        type: createRequestDto.type,
        status: createRequestDto.status,
      },
    });
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
    return this.prisma.request.update({
      where: {
        idRequest: id,
      },
      data: updateRequestDto,
    });
  }

  async remove(id: number) {
    return this.prisma.request.delete({
      where: {
        idRequest: id,
      },
    });
  }
}