import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createPlayerDto: CreatePlayerDto) {
    console.log(createPlayerDto)

    return this.prisma.player.create({
      data: {
        name: createPlayerDto.name,
        dateBirth: new Date(createPlayerDto.dateBirth),
        user: {
          connect: {
            idUser: createPlayerDto.idUser,
          },
        },
      }
    });
  }

  findAll() {
    return `This action returns all player`;
  }

  findOne(id: number) {
    return `This action returns a #${id} player`;
  }

  update(id: number, updatePlayerDto: UpdatePlayerDto) {
    return `This action updates a #${id} player`;
  }

  remove(id: number) {
    return `This action removes a #${id} player`;
  }
}
