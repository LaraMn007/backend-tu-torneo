import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Patch,
  Param,
  BadRequestException,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  async createUSer(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAllUSer() {
    return this.usersService.findAllUser();
  }

  @Get(':id')
  async findUSerbyId(@Param('id') id: string) {
    const userFound = await this.usersService.findByUSer(+id);

    if (!userFound) {
      throw new NotFoundException(
        `Usuario ${id} no encontrado`,
      );
    }

    return userFound;
  }

  @Patch(':id')
  async updateUSer(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUSer(+id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeUSer(@Param('id') id: string): Promise<void> {
    await this.usersService.removeUSer(+id);
  }
}
