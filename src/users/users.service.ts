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

const publicUserSelect = {
  idUser: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const passwordHash = await hashPassword(data.password);

    try {
      return await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: passwordHash,
        },
        select: publicUserSelect,
      });
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

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { idUser: id },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    return user;
  }

  // Backward-compatible name used by JwtStrategy.
  async findByUSer(id: number) {
    return this.findById(id);
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

  async updateUser(idUser: number, updateUserDto: UpdateUserDto) {
    try {
      const dataToUpdate: Prisma.UserUpdateInput = {};
      if (updateUserDto.name !== undefined) dataToUpdate.name = updateUserDto.name;
      if (updateUserDto.email !== undefined) dataToUpdate.email = updateUserDto.email;
      if (updateUserDto.password) {
        dataToUpdate.password = await hashPassword(updateUserDto.password);
      }

      return await this.prisma.user.update({
        where: { idUser },
        data: dataToUpdate,
        select: publicUserSelect,
      });
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

  // Backward-compatible name.
  async updateUSer(idUser: number, updateUserDto: UpdateUserDto) {
    return this.updateUser(idUser, updateUserDto);
  }

  async removeUser(idUser: number): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { idUser },
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

  // Backward-compatible name.
  async removeUSer(idUser: number): Promise<void> {
    return this.removeUser(idUser);
  }
}
