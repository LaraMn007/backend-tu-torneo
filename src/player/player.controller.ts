import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { PlayerService } from './player.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Controller('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post()
  async createUSers(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playerService.create(createPlayerDto);
  }

  @Get()
  findAllUser() {
    return this.playerService.findAll();
  }

  @Get(':id')
  findUserById(@Param('id') id: string) {
    return this.playerService.findOne(+id);
  }

  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @Body() updatePlayerDto: UpdatePlayerDto,
  ) {
    return this.playerService.update(+id, updatePlayerDto);
  }

  @Delete(':id')
  removeUser(@Param('id') id: string) {
    return this.playerService.remove(+id);
  }
}
