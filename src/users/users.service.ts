import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }
  async create(data: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El usuario ya existe');
      }

      throw error;
    }
  }

  async findAllUser() {
    return this.prisma.user.findMany();
  }

  async findByUSer(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        idUser: id,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario ${id} no encontrado`,
      );
    }

    return user;
  }

  async updateUSer(
    idUser: number,
    updateUserDto: UpdateUserDto,
  ) {
    try {
      return await this.prisma.user.update({
        where: {
          idUser,
        },
        data: {
          password: updateUserDto.password,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'El usuario ya existe',
          );
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Usuario ${idUser} no encontrado`,
          );
        }
      }

      throw error;
    }
  }

  async removeUSer(idUser: number): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: {
          idUser,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            'El usuario no puede ser eliminado porque tiene relaciones asociadas',
          );
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Usuario ${idUser} no encontrado`,
          );
        }
      }

      throw error;
    }
  }
}
