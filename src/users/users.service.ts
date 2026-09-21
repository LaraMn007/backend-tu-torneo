import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';

import { hashPassword } from '../auth/password';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type PublicUser = {
  idUser: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicUser(user: PublicUser): PublicUser {
  const { idUser, name, email, createdAt, updatedAt } = user;
  return { idUser, name, email, createdAt, updatedAt };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const passwordHash = await hashPassword(data.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: passwordHash,
        },
        select: {
          idUser: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return toPublicUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El email ya está registrado');
      }

      throw error;
    }
  }

  async findAllUser() {
    return this.prisma.user.findMany({
      select: {
        idUser: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByUSer(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        idUser: id,
      },
      select: {
        idUser: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    return toPublicUser(user);
  }

  async findCredentialsByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        idUser: true,
        password: true,
      },
    });
  }

  async updateUSer(
    idUser: number,
    updateUserDto: UpdateUserDto,
  ) {
    try {
      const dataToUpdate = updateUserDto.password
        ? {
            password: await hashPassword(updateUserDto.password),
          }
        : {};

      const user = await this.prisma.user.update({
        where: {
          idUser,
        },
        data: dataToUpdate,
        select: {
          idUser: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return toPublicUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('El email ya está registrado');
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(`Usuario ${idUser} no encontrado`);
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
          throw new NotFoundException(`Usuario ${idUser} no encontrado`);
        }
      }

      throw error;
    }
  }
}
