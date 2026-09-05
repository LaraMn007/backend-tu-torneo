import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Patch,
  Param,
  BadRequestException,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
      throw new BadRequestException('Usuario no encontrado');
      return userFound;
    }
  }

  @Patch(':id')
  async updateUSer(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUSer(+id, updateUserDto);
  }

  @Delete(':id')
  async removeUSer(@Param('id') id: string) {
    return await this.usersService.removeUSer(+id);
  }
}
