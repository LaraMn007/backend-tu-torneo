import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }
  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
    });
  }

  async findAllUser() {
    return this.prisma.user.findMany();
  }

  async findByUSer(id: number) {
    return this.prisma.user.findUnique({
      where: {
        idUser: id,
      },
    });
  }

  async updateUSer(idUser: number, updateUserDto: UpdateUserDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        idUser,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario ${idUser} no encontrado`,
      );
    }

    return this.prisma.user.update({
      where: {
        idUser,
      },
      data: {
        password: updateUserDto.password,
      },
    });
  }

  async removeUSer(idUser: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        idUser,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario ${idUser} no encontrado`,
      );
    }

    await this.prisma.user.delete({
      where: {
        idUser,
      },
    });
  }
}
