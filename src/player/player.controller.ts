import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { PlayerService } from './player.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) { }

  @Post()
  async create(@Body() createPlayerDto: CreatePlayerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.playerService.create(createPlayerDto, user.idUser);
  }

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.playerService.findByUser(user.idUser);
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.playerService.findByUserForUser(userId, user.idUser);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.playerService.findOneForUser(id, user.idUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlayerDto: UpdatePlayerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.playerService.update(id, updatePlayerDto, user.idUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.playerService.remove(id, user.idUser);
  }
}
